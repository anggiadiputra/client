import { useEffect, useState } from 'react';
import { 
  Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft, Clock, 
  CreditCard, ExternalLink, Loader2, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { walletAPI } from '../lib/api';
import { useAppSettings as useGlobalContext } from '../context/AppContext';

export default function BillingPage() {
  const navigate = useNavigate();
  const { wallet, subscription, refreshSaaSData, userRole } = useGlobalContext();

  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('50000');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await walletAPI.get();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch wallet history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseInt(topupAmount);
    if (isNaN(amount) || amount < 10000) {
      alert('Minimal Top-up adalah Rp 10.000');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await walletAPI.initiateTopup(amount);
      if (result.payment_url) {
        // Redirect to Pakasir or open in new tab
        window.open(result.payment_url, '_blank');
        alert('Tautan pembayaran telah dibuka di tab baru. Silakan selesaikan pembayaran. Saldo akan bertambah otomatis setelah transaksi sukses.');
      }
    } catch (error) {
      console.error('Top-up error:', error);
      alert('Gagal menginisialisasi pembayaran. Hubungi admin.');
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing & Wallet</h1>
        <p className="text-sm text-gray-500">Kelola saldo, riwayat transaksi, dan langganan Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Wallet Card & Top-up */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-100 mb-4 opacity-80">
                <Wallet size={18} />
                <span className="text-sm font-medium uppercase tracking-wider text-xs">Saldo Saat Ini</span>
              </div>
              <div className="text-4xl font-extrabold mb-1 tracking-tight">
                Rp {parseFloat(wallet?.balance || '0').toLocaleString('id-ID')}
              </div>
              <div className="text-blue-100/60 text-xs mt-2">
                Dompet Digital Invoizes
              </div>
            </div>
            {/* Geometric Decorative Elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
          </div>

          {/* Plan Status Widget */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              Status Langganan
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Paket Aktif</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase text-[10px] tracking-wide">
                  {subscription?.plan?.name || 'Free'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Berlaku Sampai</span>
                <span className="text-sm font-bold text-gray-900">
                  {subscription?.expires_at ? formatDate(subscription.expires_at) : 'Selamanya'}
                </span>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => navigate('/pricing')}
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Ubah Paket
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Top-up Form */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Isi Saldo (Top-up)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Nominal (Rp)</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['50000', '100000', '250000', '500000'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                        topupAmount === amt 
                          ? 'border-blue-600 bg-blue-50 text-blue-600' 
                          : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {parseInt(amt).toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">Minimal pengisian Rp 10.000. Metode: QRIS, VA, E-Wallet.</p>
              </div>
              <button 
                onClick={handleTopup}
                disabled={isProcessing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Top-up Sekarang
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Riwayat Transaksi</h3>
              <button 
                onClick={fetchHistory}
                className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"
                title="Refresh history"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="text-sm font-medium">Memuat riwayat...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
                  <Clock size={48} className="opacity-20" />
                  <p className="text-sm font-medium">Belum ada riwayat transaksi</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">Status & Deskripsi</th>
                      <th className="px-6 py-4">Waktu</th>
                      <th className="px-6 py-4 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl scale-90 ${
                              tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {tx.type === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{tx.description}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mt-0.5">
                                Ref: {tx.pakasir_order_id || 'Internal System'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-600">{formatDate(tx.created_at)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className={`font-bold text-sm ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'deposit' ? '+' : '-'} Rp {Math.abs(parseFloat(tx.amount)).toLocaleString('id-ID')}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Saldo: Rp {parseFloat(tx.balance_after).toLocaleString('id-ID')}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
