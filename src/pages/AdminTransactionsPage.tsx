import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, PlusCircle, 
  ArrowUpRight, ArrowDownLeft, Clock,
  Loader2, RefreshCw, X, AlertTriangle,
  ExternalLink, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { walletAPI, usersAPI } from '../lib/api';
import { WalletTransaction, User } from '../types';
import { toast } from '../components/Toast';
import KeyboardShortcutWrapper from '../components/KeyboardShortcutWrapper';
import { SkeletonTable } from '../components/LoadingSkeleton';

export default function AdminTransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [formData, setFormData] = useState({
    userId: '',
    email: '', // for display
    amount: '',
    type: 'deposit' as 'deposit' | 'deduction' | 'refund',
    description: ''
  });

  // Live User Search State
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced user search
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      // Only search if it's a fresh adjust (no userId) and there's enough characters
      if (showAdjustModal && !formData.userId && formData.email.length >= 2) {
        setIsSearchingUser(true);
        try {
          const result = await usersAPI.getAll(1, 5, formData.email, undefined, { signal: controller.signal });
          setUserSuggestions(result.users || []);
          setShowSuggestions(true);
        } catch (err: any) {
          if (err.name !== 'AbortError') console.error('Failed to search users:', err);
        } finally {
          setIsSearchingUser(false);
        }
      } else {
        setUserSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.email, showAdjustModal, formData.userId]);

  const fetchTransactions = async (options?: RequestInit) => {
    setLoading(true);
    try {
      const data = await walletAPI.getAllTransactions(page, limit, searchTerm, options);
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchTransactions({ signal: controller.signal });
    }, searchTerm ? 500 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, searchTerm]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleCancelTransaction = async (orderId: string) => {
    if (!window.confirm(`Batalkan transaksi ${orderId}? Saldo tidak akan ditambahkan.`)) return;
    
    try {
      const result = await walletAPI.cancelTopup(orderId);
      toast.success(result.message || 'Transaksi berhasil dibatalkan');
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem');
    }
  };

  const filteredTransactions = transactions;

  const handleOpenAdjust = (tx?: WalletTransaction) => {
    setFormData({
      userId: tx ? String(tx.user_id) : '',
      email: tx ? tx.email || '' : '',
      amount: '',
      type: 'deposit',
      description: ''
    });
    setUserSuggestions([]);
    setShowSuggestions(false);
    setShowAdjustModal(true);
  };

  const handleSelectUser = (user: User) => {
    setFormData(prev => ({
      ...prev,
      userId: String(user.id),
      email: user.email
    }));
    setShowSuggestions(false);
    setUserSuggestions([]);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(formData.userId || formData.email) || !formData.amount || !formData.description) {
      toast.error('Semua field harus diisi (Target user, nominal, dan alasan)');
      return;
    }

    setAdjusting(true);
    try {
      await walletAPI.manualAdjust(
        formData.userId ? Number(formData.userId) : null,
        Number(formData.amount),
        formData.type,
        formData.description,
        formData.email
      );
      toast.success('Saldo berhasil disesuaikan');
      setShowAdjustModal(false);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyesuaikan saldo');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-tx-main mb-1">Transaksi Global</h1>
          <p className="text-sm text-tx-muted">Pantau dan kelola semua transaksi saldo dompet dari seluruh pengguna</p>
        </div>
        <button
          onClick={() => handleOpenAdjust()}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <PlusCircle size={16} />
          Penyesuaian Saldo Manual
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle" size={16} />
          <input
            type="text"
            placeholder="Cari user, email, atau ID order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-tx-subtle"
          />
        </div>
        <button 
          onClick={fetchTransactions}
          className="p-2 text-tx-subtle hover:bg-surface-2 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-surface rounded-lg border border-separator shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <SkeletonTable rows={10} columns={6} />
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-tx-subtle space-y-3">
            <Clock size={48} className="opacity-20" />
            <p className="text-sm font-medium">Belum ada riwayat transaksi</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-2 border-b border-separator text-xs font-bold text-tx-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Transaksi</th>
                    <th className="px-4 py-2">Waktu</th>
                    <th className="px-4 py-2 text-right">Nominal</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-tx-main">{tx.first_name} {tx.last_name}</span>
                          <span className="text-xs text-tx-subtle font-mono">{tx.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-tx-main">{tx.description}</span>
                          <span className="text-xs text-tx-subtle font-mono">{tx.payment_order_id || 'SYSTEM'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-tx-muted">
                        {new Date(tx.created_at).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${
                          tx.status === 'failed' || (tx.status === 'pending' && tx.expired_at && new Date(tx.expired_at) < new Date())
                            ? 'text-tx-subtle' 
                            : tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Rp {tx.type === 'deposit' ? (tx.status === 'completed' || (tx.status === 'pending' && (!tx.expired_at || new Date(tx.expired_at) > new Date())) ? '+' : '') : '-'} {Math.abs(parseFloat(String(tx.amount))).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          {tx.status === 'pending' && (
                            <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-black uppercase tracking-tight border ${
                              tx.expired_at && new Date(tx.expired_at) < new Date() 
                                ? 'bg-surface-2 text-tx-subtle border-separator' 
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:border-amber-800/30'
                            }`}>
                              {tx.expired_at && new Date(tx.expired_at) < new Date() ? 'Kadaluarsa' : 'Pending'}
                            </span>
                          )}
                          {tx.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-black uppercase tracking-tight bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-400 dark:border-green-800/30">
                              Berhasil
                            </span>
                          )}
                          {tx.status === 'failed' && (
                            <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-black uppercase tracking-tight bg-red-500/10 text-red-700 border border-red-500/20 dark:text-red-400 dark:border-red-800/30">
                              Gagal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(tx.invoice_id || tx.system_invoice_id) && (
                            <button
                              onClick={() => navigate(`/invoices/${tx.invoice_number || tx.invoice_id || tx.system_invoice_id}/view`)}
                              className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded border border-blue-500/20 transition-colors"
                              title="Lihat Kwitansi"
                            >
                              <ExternalLink size={16} />
                            </button>
                          )}
                          {tx.status === 'pending' && tx.payment_order_id && (!tx.expired_at || new Date(tx.expired_at) > new Date()) && (
                            <button
                              onClick={() => handleCancelTransaction(tx.payment_order_id!)}
                              className="p-1.5 text-red-600 hover:bg-red-500/10 rounded border border-red-500/20 transition-colors"
                              title="Batalkan Transaksi"
                            >
                              <Trash2 size={16} />
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
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-3.5 bg-surface hover:bg-surface-2 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-tx-main truncate">{tx.first_name} {tx.last_name}</p>
                      <p className="text-xs text-tx-subtle font-mono truncate">{tx.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-black tabular-nums ${
                        tx.status === 'failed' || (tx.status === 'pending' && tx.expired_at && new Date(tx.expired_at) < new Date())
                          ? 'text-tx-subtle' 
                          : tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Rp {tx.type === 'deposit' ? (tx.status === 'completed' || (tx.status === 'pending' && (!tx.expired_at || new Date(tx.expired_at) > new Date())) ? '+' : '') : '-'} {Math.abs(parseFloat(String(tx.amount))).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-tx-main truncate">{tx.description}</p>
                      <p className="text-[10px] text-tx-subtle font-mono truncate">{tx.payment_order_id || 'SYSTEM'}</p>
                    </div>
                    <div className="shrink-0 ml-2">
                      {tx.status === 'pending' && (
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight border ${
                          tx.expired_at && new Date(tx.expired_at) < new Date() 
                            ? 'bg-surface-2 text-tx-subtle border-separator' 
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:border-amber-800/30'
                        }`}>
                          {tx.expired_at && new Date(tx.expired_at) < new Date() ? 'Kadaluarsa' : 'Pending'}
                        </span>
                      )}
                      {tx.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-400 dark:border-green-800/30">
                          Berhasil
                        </span>
                      )}
                      {tx.status === 'failed' && (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight bg-red-500/10 text-red-700 border border-red-500/20 dark:text-red-400 dark:border-red-800/30">
                          Gagal
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-separator text-[11px] text-tx-muted">
                    <span>
                      {new Date(tx.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(tx.invoice_id || tx.system_invoice_id) && (
                        <button
                          onClick={() => navigate(`/invoices/${tx.invoice_number || tx.invoice_id || tx.system_invoice_id}/view`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded border border-blue-500/20 transition-colors"
                          title="Lihat Kwitansi"
                        >
                          <ExternalLink size={14} />
                        </button>
                      )}
                      {tx.status === 'pending' && tx.payment_order_id && (!tx.expired_at || new Date(tx.expired_at) > new Date()) && (
                        <button
                          onClick={() => handleCancelTransaction(tx.payment_order_id!)}
                          className="p-1.5 text-red-600 hover:bg-red-500/10 rounded border border-red-500/20 transition-colors"
                          title="Batalkan Transaksi"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-4 py-3 border-t border-separator flex items-center justify-between bg-surface">
            <div className="text-xs text-tx-muted font-medium">
              Menampilkan {(page - 1) * limit + 1} sampai {Math.min(page * limit, total)} dari {total} transaksi
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 border border-separator rounded-md hover:bg-surface-2 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total || loading}
                className="p-1.5 border border-separator rounded-md hover:bg-surface-2 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Adjust Modal */}
      {showAdjustModal && (
        <KeyboardShortcutWrapper onClose={() => setShowAdjustModal(false)} disabled={adjusting}>
          <div className="bg-surface rounded-xl shadow-lg max-w-md w-full my-8 overflow-hidden border border-separator animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
              <h2 className="text-lg font-bold text-tx-main">Adjust User Balance</h2>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-tx-subtle hover:text-tx-muted"
                disabled={adjusting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-amber-800">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Perubahan saldo manual akan dicatat sebagai riwayat transaksi resmi. Pastikan Anda memiliki alasan yang kuat sebelum mengubah saldo pengguna.
                </p>
              </div>

              {!formData.userId ? (
                <div className="relative">
                  <label className="block text-xs font-bold text-tx-muted uppercase tracking-wider mb-1.5">User Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                      placeholder="Masukkan email user"
                    />
                    {isSearchingUser && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={14} className="animate-spin text-tx-subtle" />
                      </div>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-surface border border-separator rounded-lg shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                      {userSuggestions.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-500/10 transition-colors flex flex-col border-b border-separator last:border-0"
                        >
                          <span className="text-sm font-bold text-tx-main">{user.email}</span>
                          <span className="text-[11px] text-tx-muted">{user.first_name} {user.last_name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showSuggestions && userSuggestions.length === 0 && formData.email.length >= 2 && !isSearchingUser && (
                    <div className="absolute z-50 w-full mt-1 bg-surface border border-separator rounded-lg shadow-lg px-4 py-3 text-xs text-tx-muted italic">
                      Tidak ada user ditemukan dengan email ini
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-blue-400 uppercase mb-1">Target Pengguna</p>
                    <p className="text-sm font-bold text-blue-900">{formData.email}</p>
                  </div>
                  {formData.userId && (
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, userId: '', email: '' })}
                      className="p-1 hover:bg-blue-500/15 rounded-full text-blue-400 transition-colors"
                      title="Ganti User"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-tx-muted uppercase tracking-wider mb-1.5">Tipe Adjust</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-surface"
                  >
                    <option value="deposit">Penambahan (+)</option>
                    <option value="deduction">Pengurangan (-)</option>
                    <option value="refund">Refund (Kembalikan)</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-tx-muted uppercase tracking-wider mb-1.5">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-tx-muted uppercase tracking-wider mb-1.5">Alasan / Deskripsi</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Contoh: Refund double payment"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={adjusting}
                  className={`flex-1 text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    formData.type === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {adjusting ? <Loader2 size={16} className="animate-spin" /> : formData.type === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  Eksekusi Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  disabled={adjusting}
                  className="px-6 border border-separator hover:bg-surface-2 text-tx-muted font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </KeyboardShortcutWrapper>
      )}
    </div>
  );
}
