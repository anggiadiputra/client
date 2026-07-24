import { useEffect, useState } from 'react';
import { 
  Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft, Clock, 
  ExternalLink, Loader2, CheckCircle2, QrCode, CreditCard, 
  Building2, X, Info, Copy, AlertCircle, Trash2,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { walletAPI } from '../lib/api';
import { useAppSettings as useGlobalContext } from '../context/AppContext';
import { toast } from '../components/Toast';
import KeyboardShortcutWrapper from '../components/KeyboardShortcutWrapper';
import { SkeletonTable } from '../components/LoadingSkeleton';

export default function BillingPage() {
  const navigate = useNavigate();
  const { wallet, subscription, userRole, refreshSaaSData } = useGlobalContext();

  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('50000');
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const fetchHistory = async (options?: RequestInit) => {
    setLoading(true);
    try {
      const data = await walletAPI.get(page, limit, searchTerm, options);
      setHistory(data.history || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error('Failed to fetch wallet history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchHistory({ signal: controller.signal });
    }, searchTerm ? 500 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, searchTerm]);

  // Reset to page 1 whenever search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleStartCheckout = () => {
    const amount = parseInt(topupAmount);
    if (isNaN(amount) || amount < 10000) {
      toast.error('Minimal Top-up adalah Rp 10.000');
      return;
    }

    // Check for existing pending transaction that is not expired
    const pendingTx = history.find(tx => 
      tx.status === 'pending' && 
      tx.type === 'deposit' && 
      (!tx.expired_at || new Date(tx.expired_at) > new Date())
    );

    if (pendingTx) {
      toast.info('Menampilkan tagihan Anda yang belum diselesaikan.');
      handleResumePayment(pendingTx);
      return;
    }

    setShowCheckoutModal(true);
    setCheckoutData(null);
    setSelectedMethod('');
  };

  const handleConfirmOrder = async () => {
    if (!selectedMethod) {
      toast.error('Pilih metode pembayaran terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await walletAPI.initiateTopup(parseInt(topupAmount), selectedMethod);
      setCheckoutData(result);
      toast.success('Tagihan berhasil dibuat!');
    } catch (error: any) {
      console.error('Top-up error:', error);
      toast.error(error.message || 'Gagal membuat tagihan. Hubungi admin.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!checkoutData) return;
    
    setIsCheckingStatus(true);
    try {
      const result = await walletAPI.checkStatus(checkoutData.order_id, checkoutData.amount);
      if (result.status === 'completed') {
        toast.success('Pembayaran Berhasil! Saldo telah ditambahkan.');
        setShowCheckoutModal(false);
        refreshSaaSData();
        fetchHistory();
      } else if (result.status === 'pending') {
        toast.info('Status masih PENDING (Menunggu Pembayaran)');
      } else {
        toast.error(`Status Pembayaran: ${result.status.toUpperCase()}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengecek status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleResumePayment = (tx: any) => {
    try {
      if (!tx) return;
      
      // Ensure amount is parsed correctly for the UI
      const amount = parseFloat(tx.amount);
      setTopupAmount(String(amount));
      
      // Reconstruct checkout data
      // amount in DB is NOMINAL, fee_amount is FEE
      const nominalAmount = parseFloat(tx.amount);
      const feeAmount = parseFloat(tx.fee_amount || 0);
      const totalAmount = nominalAmount + feeAmount;

      setCheckoutData({
        order_id: tx.payment_order_id,
        amount: totalAmount,
        nominal: nominalAmount,
        fee_amount: feeAmount,
        payment_url: tx.payment_url,
        payment_link_url: tx.payment_url, // Sumopod returns payment_link_url stored in payment_url column
        payment_method: tx.payment_method,
        payment_number: tx.payment_number,
        expired_at: tx.expired_at,
        created_at: tx.created_at
      });
      
      // Set method for UI state
      setSelectedMethod(tx.payment_method || '');
      
      // Check if already expired locally for better UX
      if (tx.expired_at && new Date(tx.expired_at) < new Date()) {
        toast.error('Pembayaran ini sudah kadaluarsa. Silakan isi saldo baru.');
        // Optional: you could call checkStatus here to sync with server, but toast is enough for now
        return;
      }

      // Finally show the modal
      setShowCheckoutModal(true);
    } catch (err) {
      console.error('Error resuming payment:', err);
      toast.error('Gagal memuat detail pembayaran. Silakan coba buat top-up baru.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Berhasil disalin ke clipboard');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelTopup = async () => {
    if (!checkoutData?.order_id) return;
    if (!window.confirm('Batalkan transaksi ini?')) return;
    
    setIsCheckingStatus(true);
    try {
      const result = await walletAPI.cancelTopup(checkoutData.order_id);
      toast.success(result.message || 'Transaksi dibatalkan');
      setShowCheckoutModal(false);
      setCheckoutData(null);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const paymentMethods = [
    { id: 'qris', name: 'QRIS (Semua E-Wallet)', icon: QrCode },
    { id: 'bri_va', name: 'BRI Virtual Account', icon: Building2 },
    { id: 'bni_va', name: 'BNI Virtual Account', icon: Building2 },
    { id: 'permata_va', name: 'Permata Virtual Account', icon: Building2 },
    { id: 'cimb_niaga_va', name: 'CIMB Niaga VA', icon: Building2 },
    { id: 'maybank_va', name: 'Maybank VA', icon: Building2 },
    { id: 'bnc_va', name: 'BNC (Neo Bank) VA', icon: Building2 },
    { id: 'atm_bersama_va', name: 'ATM Bersama', icon: Building2 },
    { id: 'paypal', name: 'PayPal', icon: CreditCard },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-tx-main mb-1">Billing & Wallet</h1>
          <p className="text-sm text-tx-muted">Kelola saldo, riwayat transaksi, dan langganan Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Wallet Card & Top-up */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface rounded-lg p-6 border border-separator shadow-sm">
            <div className="flex items-center gap-2 text-tx-muted mb-2">
              <Wallet size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Saldo Saat Ini</span>
            </div>
            <div className="text-3xl font-bold text-tx-main mb-1">
              Rp {parseFloat(wallet?.balance || '0').toLocaleString('id-ID')}
            </div>
            <div className="text-tx-subtle text-xs mt-1">
              Dompet Digital Invoizes
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-separator shadow-sm">
            <h3 className="text-sm font-semibold text-tx-main mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              Status Langganan
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-separator">
                <span className="text-xs text-tx-muted font-medium">Paket Aktif</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wide">
                  {subscription?.plan?.name || 'Free'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-separator">
                <span className="text-xs text-tx-muted font-medium">Berlaku Sampai</span>
                <span className="text-xs font-bold text-tx-main">
                  {subscription?.expires_at ? formatDate(subscription.expires_at) : 'Selamanya'}
                </span>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => navigate('/pricing')}
                  className="w-full py-2 bg-surface border border-separator hover:bg-surface-2 text-tx-muted text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Ubah Paket
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-separator shadow-sm">
            <h3 className="text-sm font-semibold text-tx-main mb-4">Isi Saldo (Top-up)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-tx-muted mb-2 uppercase tracking-wide">Nominal (Rp)</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['50000', '100000', '250000', '500000'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-md border transition-colors ${
                        topupAmount === amt 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-700' 
                          : 'border-separator bg-surface text-tx-muted hover:bg-surface-2'
                      }`}
                    >
                      {parseInt(amt).toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle font-medium text-sm">Rp</span>
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-tx-subtle"
                    placeholder="0"
                  />
                </div>
              </div>
              <button 
                onClick={handleStartCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Isi Saldo Sekarang
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-lg border border-separator shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-separator flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tx-subtle" size={14} />
                <input
                  type="text"
                  placeholder="Cari riwayat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-separator rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              <button 
                onClick={fetchHistory}
                className="p-1.5 hover:bg-surface-2 rounded text-tx-subtle hover:text-tx-muted transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[400px]">
              {loading ? (
                <SkeletonTable rows={5} columns={4} className="border-none shadow-none" />
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-tx-subtle space-y-2">
                  <Clock size={32} className="opacity-20" />
                  <p className="text-xs font-medium">Belum ada riwayat transaksi</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-2 border-b border-separator text-[10px] font-bold text-tx-muted uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-2">Transaksi</th>
                          <th className="px-4 py-2">ID Ref</th>
                          <th className="px-4 py-2">Waktu</th>
                          <th className="px-4 py-2 text-right">Nominal</th>
                          <th className="px-4 py-2 text-center">Status</th>
                          <th className="px-4 py-2 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-separator">
                        {history.map((tx) => (
                          <tr key={tx.id} className="hover:bg-surface-2 transition-colors">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center w-5 h-5 rounded ${
                                  tx.type === 'deposit' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                }`}>
                                  {tx.type === 'deposit' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                </div>
                                <span 
                                  className={`text-[12px] font-semibold ${
                                    tx.status === 'pending' && tx.payment_order_id && (!tx.expired_at || new Date(tx.expired_at) > new Date())
                                      ? 'text-blue-600 cursor-pointer hover:underline' 
                                      : 'text-tx-main'
                                  }`}
                                  onClick={() => {
                                    if (tx.status === 'pending' && tx.payment_order_id && (!tx.expired_at || new Date(tx.expired_at) > new Date())) {
                                      setCheckoutData({
                                        order_id: tx.payment_order_id,
                                        amount: tx.amount,
                                        payment_url: tx.payment_url,
                                        payment_link_url: tx.payment_url,
                                        payment_method: tx.payment_method,
                                        payment_number: tx.payment_number,
                                        expired_at: tx.expired_at,
                                        created_at: tx.created_at
                                      });
                                      setShowCheckoutModal(true);
                                    }
                                  }}
                                >
                                  {tx.description}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-[10px] font-mono text-tx-subtle">{tx.payment_order_id || '-'}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-[10px] text-tx-muted">{formatDate(tx.created_at)}</span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <p className={`font-bold text-[12px] ${
                                tx.status === 'failed' || (tx.status === 'pending' && tx.expired_at && new Date(tx.expired_at) < new Date())
                                  ? 'text-tx-subtle' 
                                  : tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Rp {tx.type === 'deposit' ? (tx.status === 'completed' || (tx.status === 'pending' && (!tx.expired_at || new Date(tx.expired_at) > new Date())) ? '+' : '') : '-'} {Math.abs(parseFloat(tx.amount)).toLocaleString('id-ID')}
                              </p>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex justify-center">
                                {tx.status === 'pending' && (
                                  <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter border ${
                                    tx.expired_at && new Date(tx.expired_at) < new Date() 
                                      ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  }`}>
                                    {tx.expired_at && new Date(tx.expired_at) < new Date() ? 'Gagal' : 'Pending'}
                                  </span>
                                )}
                                {tx.status === 'completed' && (
                                  <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter bg-green-500/10 text-green-700 border border-green-500/20">
                                    Berhasil
                                  </span>
                                )}
                                {tx.status === 'failed' && (
                                  <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter bg-red-500/10 text-red-700 border border-red-500/20">
                                    Gagal
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {tx.status === 'pending' && tx.payment_order_id && (!tx.expired_at || new Date(tx.expired_at) > new Date()) && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const btn = e.currentTarget;
                                      btn.disabled = true;
                                      try {
                                        const res = await walletAPI.checkStatus(tx.payment_order_id, tx.amount);
                                        if (res.status === 'completed') {
                                          toast.success('Berhasil!');
                                          refreshSaaSData();
                                          fetchHistory();
                                        }
                                      } catch (err) {
                                        toast.error('Gagal');
                                      } finally {
                                        btn.disabled = false;
                                      }
                                    }}
                                    className="p-1 text-amber-600 hover:bg-amber-500/10 rounded border border-amber-500/20 transition-colors"
                                    title="Cek Status"
                                  >
                                    <RefreshCw size={12} />
                                  </button>
                                )}
                                 {(tx.system_invoice_id || tx.invoice_id) && (
                                   <button
                                     onClick={() => navigate(`/invoices/${tx.invoice_number || tx.system_invoice_id || tx.invoice_id}/view`)}
                                     className="p-1 text-blue-600 hover:bg-blue-500/10 rounded border border-blue-500/20 transition-colors"
                                     title="Lihat Kwitansi"
                                   >
                                     <ExternalLink size={12} />
                                   </button>
                                 )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden divide-y divide-separator pt-2">
                    {history.map((tx) => (
                      <div key={tx.id} className="p-3.5 bg-surface hover:bg-surface-2 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-start gap-2.5">
                            <div className={`flex items-center justify-center w-6 h-6 rounded shrink-0 mt-0.5 ${
                              tx.type === 'deposit' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                            }`}>
                              {tx.type === 'deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            <div className="min-w-0">
                              <p 
                                className={`text-sm font-bold truncate leading-tight ${
                                  tx.status === 'pending' && tx.payment_order_id && (!tx.expired_at || new Date(tx.expired_at) > new Date())
                                    ? 'text-blue-600 cursor-pointer hover:underline' 
                                    : 'text-tx-main'
                                }`}
                                onClick={() => {
                                  if (tx.status === 'pending' && tx.payment_order_id && (!tx.expired_at || new Date(tx.expired_at) > new Date())) {
                                    setCheckoutData({
                                      order_id: tx.payment_order_id,
                                      amount: tx.amount,
                                      payment_url: tx.payment_url,
                                      payment_link_url: tx.payment_url,
                                      payment_method: tx.payment_method,
                                      payment_number: tx.payment_number,
                                      expired_at: tx.expired_at,
                                      created_at: tx.created_at
                                    });
                                    setShowCheckoutModal(true);
                                  }
                                }}
                              >
                                {tx.description}
                              </p>
                              <div className="text-[10px] text-tx-subtle font-mono mt-0.5">{tx.payment_order_id || '-'}</div>
                            </div>
                          </div>
                          <p className={`font-black text-sm tabular-nums shrink-0 ${
                            tx.status === 'failed' || (tx.status === 'pending' && tx.expired_at && new Date(tx.expired_at) < new Date())
                              ? 'text-tx-subtle' 
                              : tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'deposit' ? (tx.status === 'completed' || (tx.status === 'pending' && (!tx.expired_at || new Date(tx.expired_at) > new Date())) ? '+' : '') : '-'} Rp {Math.abs(parseFloat(tx.amount)).toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-separator text-xs">
                          <span className="text-tx-muted text-[11px]">{formatDate(tx.created_at)}</span>
                          <div className="flex items-center gap-1.5">
                            {tx.status === 'pending' && (
                              <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter border ${
                                tx.expired_at && new Date(tx.expired_at) < new Date() 
                                  ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}>
                                {tx.expired_at && new Date(tx.expired_at) < new Date() ? 'Gagal' : 'Pending'}
                              </span>
                            )}
                            {tx.status === 'completed' && (
                              <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter bg-green-500/10 text-green-700 border border-green-500/20">
                                Berhasil
                              </span>
                            )}
                            {tx.status === 'failed' && (
                              <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter bg-red-500/10 text-red-700 border border-red-500/20">
                                Gagal
                              </span>
                            )}

                            {tx.status === 'pending' && tx.payment_order_id && (!tx.expired_at || new Date(tx.expired_at) > new Date()) && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const btn = e.currentTarget;
                                  btn.disabled = true;
                                  try {
                                    const res = await walletAPI.checkStatus(tx.payment_order_id, tx.amount);
                                    if (res.status === 'completed') {
                                      toast.success('Berhasil!');
                                      refreshSaaSData();
                                      fetchHistory();
                                    }
                                  } catch (err) {
                                    toast.error('Gagal');
                                  } finally {
                                    btn.disabled = false;
                                  }
                                }}
                                className="p-1 text-amber-600 hover:bg-amber-500/10 rounded border border-amber-500/20 transition-colors"
                                title="Cek Status"
                              >
                                <RefreshCw size={12} />
                              </button>
                            )}
                            {(tx.system_invoice_id || tx.invoice_id) && (
                              <button
                                onClick={() => navigate(`/invoices/${tx.invoice_number || tx.system_invoice_id || tx.invoice_id}/view`)}
                                className="p-1 text-blue-600 hover:bg-blue-500/10 rounded border border-blue-500/20 transition-colors"
                                title="Lihat Kwitansi"
                              >
                                <ExternalLink size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="px-4 py-3 border-t border-separator flex items-center justify-between bg-surface">
                <div className="text-[11px] text-tx-muted font-medium">
                  {Math.min(page * limit, total)} dari {total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="p-1 border border-separator rounded hover:bg-surface-2 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total || loading}
                    className="p-1 border border-separator rounded hover:bg-surface-2 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOPUP MODAL CHECKOUT */}
      {showCheckoutModal && (
        <KeyboardShortcutWrapper onClose={() => !isProcessing && setShowCheckoutModal(false)} disabled={isProcessing}>
          <div className="bg-surface rounded-xl shadow-2xl max-w-lg w-full my-8 overflow-hidden border border-separator animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator bg-surface-2/50">
              <h2 className="text-lg font-bold text-tx-main flex items-center gap-2">
                <CreditCard className="text-blue-600" size={20} />
                Checkout Top-up
              </h2>
              {!isProcessing && (
                <button onClick={() => setShowCheckoutModal(false)} className="p-1.5 hover:bg-surface-2 rounded-full text-tx-subtle transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6">
              {!checkoutData ? (
                /* Step 1: Select Method */
                <div className="space-y-6">
                  <div className="p-4 bg-blue-500/10/50 border border-blue-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total Tagihan</p>
                      <p className="text-2xl font-black text-blue-900">Rp {parseInt(topupAmount).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-blue-500 font-medium">Top-up Saldo Wallet</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-tx-muted uppercase tracking-wider mb-3">Pilih Metode Pembayaran</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            selectedMethod === method.id 
                              ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500 shadow-sm' 
                              : 'border-separator hover:border-gray-300 bg-surface'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${selectedMethod === method.id ? 'bg-blue-600 text-white' : 'bg-surface-2 text-tx-subtle'}`}>
                            <method.icon size={18} />
                          </div>
                          <span className={`text-[13px] font-bold ${selectedMethod === method.id ? 'text-blue-900' : 'text-tx-muted'}`}>{method.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmOrder}
                    disabled={!selectedMethod || isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                    Konfirmasi Tagihan & Bayar
                  </button>
                </div>
              ) : (
                /* Step 2: Payment Instructions */
                <div className="space-y-6">
                  <div className="text-center pb-1">
                    <div className="inline-flex items-center justify-center p-2 bg-green-500/10 text-green-600 rounded-full mb-2">
                      <Info size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-tx-main">Instruksi Bayar</h3>
                    <p className="text-[11px] text-tx-muted mt-0.5">Selesaikan pengisian saldo melalui detail di bawah.</p>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-blue-500/10/50 border border-blue-500/20 rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-600 font-medium">Nominal Top-up</span>
                      <span className="font-bold text-blue-900">
                        Rp {parseInt(String(checkoutData.nominal || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-600 font-medium">Metode Pembayaran</span>
                      <span className="font-bold text-blue-900 uppercase">{checkoutData.payment_method || selectedMethod}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-600 font-medium">Biaya Admin</span>
                      <span className="font-bold text-blue-900">
                        Rp {parseInt(String(checkoutData.fee_amount || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-blue-500/20 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Bayar</span>
                      <span className="text-lg font-black text-blue-900">Rp {parseInt(String(checkoutData.amount || 0)).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="bg-surface-2 border border-separator rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Order ID</span>
                      <span className="text-xs font-mono font-bold text-tx-main">{checkoutData.order_id}</span>
                    </div>
                    {checkoutData.created_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Waktu Dibuat</span>
                        <span className="text-xs font-semibold text-tx-muted">
                          {new Date(checkoutData.created_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })} WIB
                        </span>
                      </div>
                    )}
                    {checkoutData.expired_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Batas Waktu</span>
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(checkoutData.expired_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })} WIB
                        </span>
                      </div>
                    )}
                  </div>

                  {checkoutData.payment_link_url && checkoutData.payment_method === 'qris' ? (
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-surface border-2 border-dashed border-separator rounded-2xl mb-4">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkoutData.payment_link_url)}`} 
                          alt="QRIS Code"
                          className="w-48 h-48 border border-white"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-tx-subtle uppercase tracking-widest mb-4 flex items-center gap-2">
                        <QrCode size={12} /> Scan QRIS melalui aplikasi e-wallet Anda
                      </p>
                    </div>
                  ) : null}

                  {checkoutData.payment_link_url ? (
                    <a
                      href={checkoutData.payment_link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] mb-3"
                    >
                      <ExternalLink size={16} />
                      Buka Halaman Pembayaran
                    </a>
                  ) : null}

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <button
                        onClick={handleCheckStatus}
                        disabled={isCheckingStatus}
                        className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-green-100 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                      >
                        {isCheckingStatus ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        Cek Status Pembayaran
                      </button>

                      <button
                        onClick={handleCancelTopup}
                        disabled={isCheckingStatus}
                        className="flex-1 bg-surface hover:bg-red-500/10 text-red-600 font-bold py-3 rounded-xl text-[11px] border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        Batalkan Pesanan
                      </button>

                      <button
                        onClick={() => setCheckoutData(null)}
                        className="flex-1 bg-surface hover:bg-surface-2 text-tx-muted font-bold py-3 rounded-xl text-[11px] border border-separator transition-all flex items-center justify-center gap-1.5"
                      >
                        <X size={14} />
                        Ganti Metode
                      </button>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-amber-700">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-relaxed">
                        Jika sudah bayar tapi saldo belum bertambah, klik <b>Cek Status</b>. Sistem akan memverifikasi pembayaran Anda secara manual.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-surface-2 border-t border-separator flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 grayscale opacity-40">
                <div className="w-5 h-5 bg-gray-400 rounded-full text-[8px] flex items-center justify-center text-white font-black">S</div>
                <span className="text-[9px] font-bold text-tx-muted tracking-tighter">SECURE PAYMENT</span>
              </div>
              <div className="flex items-center gap-1.5 grayscale opacity-40">
                 <RefreshCw size={10} className="text-tx-muted" />
                 <span className="text-[9px] font-bold text-tx-muted tracking-tighter">INSTANT TOPUP</span>
              </div>
            </div>
          </div>
        </KeyboardShortcutWrapper>
      )}
    </div>
  );
}
