import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, ChevronLeft as PrevIcon, ChevronRight as NextIcon, Loader2, CheckSquare, Square, Trash2 } from 'lucide-react';
import { emailsAPI } from '../lib/api';
import CompactBatchActions from '../components/CompactBatchActions';
import { toast } from '../components/Toast';

interface EmailLog {
  id: number;
  recipient: string;
  subject: string;
  invoice_number?: string;
  invoice_id?: number;
  status: string;
  error_message?: string;
  sent_at: string;
  customer_name?: string;
}

export default function EmailLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await emailsAPI.getAll(page, 15);
      setLogs(data.logs || []);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.length} email logs terpilih?`)) return;
    setIsBatchDeleting(true);
    try {
      await emailsAPI.batchDelete(selectedIds);
      toast.success(`${selectedIds.length} email logs berhasil dihapus`);
      setSelectedIds([]);
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus logs');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map(l => l.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'sent':
      case 'success':
        return { bg: 'bg-blue-500/15', text: 'text-blue-700', icon: CheckCircle };
      case 'failed':
      case 'error':
        return { bg: 'bg-red-500/15', text: 'text-red-700', icon: XCircle };
      default:
        return { bg: 'bg-surface-2', text: 'text-tx-muted', icon: AlertCircle };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/logs')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 mb-2 text-sm font-medium"
          >
            <ChevronLeft size={15} /> Kembali ke History
          </button>
          <h1 className="text-2xl font-bold text-tx-main mb-1">Email Logs</h1>
          <p className="text-sm text-tx-muted">Total {totalItems} riwayat pengiriman Email.</p>
        </div>

        <CompactBatchActions
          selectedCount={selectedIds.length}
          onDelete={handleBatchDelete}
          onClear={() => setSelectedIds([])}
          isLoading={isBatchDeleting}
        />
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-separator overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-2 border-b border-separator">
                <th className="w-10 px-6 py-3">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-tx-subtle hover:text-blue-600 transition-colors"
                  >
                    {selectedIds.length > 0 && selectedIds.length === logs.length ? (
                      <CheckSquare size={18} className="text-blue-600" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-tx-muted uppercase tracking-wider">Penerima</th>
                <th className="px-6 py-3 text-xs font-semibold text-tx-muted uppercase tracking-wider">Subjek</th>
                <th className="px-6 py-3 text-xs font-semibold text-tx-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-tx-muted uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-3 text-xs font-semibold text-tx-muted uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-5 h-5 bg-surface-2 rounded"></div></td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-surface-2 rounded w-28 mb-2"></div>
                      <div className="h-3 bg-surface-2 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-surface-2 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-surface-2 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-surface-2 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-5 bg-surface-2 rounded w-5 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-tx-subtle">
                    Belum ada riwayat pengiriman.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const style = getStatusStyle(log.status);
                  const Icon = style.icon;
                  return (
                    <tr key={log.id} className={`hover:bg-surface-2 transition-colors ${selectedIds.includes(log.id) ? 'bg-blue-500/10/50' : ''}`}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleSelect(log.id)}
                          className="text-tx-subtle hover:text-blue-600 transition-colors"
                        >
                          {selectedIds.includes(log.id) ? (
                            <CheckSquare size={18} className="text-blue-600" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-tx-main truncate max-w-[200px]" title={log.recipient}>
                          {log.recipient}
                        </div>
                        {log.invoice_number && (
                          <div className="text-xs text-blue-600">#{log.invoice_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm truncate max-w-[200px]" title={log.subject}>{log.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          <Icon size={12} />
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-tx-muted flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatDate(log.sent_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/logs/email/${log.id}`)}
                          className="text-tx-subtle hover:text-blue-600 transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        {!loading && (
          <div className="md:hidden divide-y divide-separator border-t border-separator">
            {logs.length === 0 ? (
              <div className="py-20 text-center text-tx-subtle text-sm">
                Belum ada riwayat pengiriman.
              </div>
            ) : (
              logs.map((log) => {
                const style = getStatusStyle(log.status);
                const Icon = style.icon;
                return (
                  <div key={log.id} className={`p-4 hover:bg-surface-2 transition-colors ${selectedIds.includes(log.id) ? 'bg-blue-500/10/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => toggleSelect(log.id)}
                        className="mt-1 text-tx-subtle transition-colors"
                      >
                        {selectedIds.includes(log.id) ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => navigate(`/logs/email/${log.id}`)}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-tx-main truncate pr-2" title={log.recipient}>
                            {log.recipient}
                          </div>
                          <span className={`${style.bg} ${style.text} px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap`}>
                            {log.status}
                          </span>
                        </div>
                        <div className="text-xs text-tx-muted truncate mb-2" title={log.subject}>
                          {log.subject}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] text-tx-muted">
                            <Clock size={12} className="text-tx-subtle" />
                            {formatDate(log.sent_at)}
                          </div>
                          {log.invoice_number && (
                            <span className="text-[10px] text-blue-600 font-medium">#{log.invoice_number}</span>
                          )}
                          <ChevronRight size={16} className="text-tx-subtle" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Mobile Loading Skeleton */}
        {loading && (
          <div className="md:hidden divide-y divide-separator border-t border-separator animate-pulse">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-surface-2 rounded w-1/2"></div>
                  <div className="h-4 bg-surface-2 rounded w-16"></div>
                </div>
                <div className="h-3 bg-surface-2 rounded w-3/4"></div>
                <div className="h-2 bg-surface-2 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-surface-2 border-t border-separator flex items-center justify-between">
            <div className="text-sm text-tx-muted">
              Halaman <span className="font-semibold text-tx-main">{page}</span> dari <span className="font-semibold text-tx-main">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded bg-surface text-sm font-medium hover:bg-surface-2 disabled:opacity-50 transition-colors"
              >
                <PrevIcon size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded bg-surface text-sm font-medium hover:bg-surface-2 disabled:opacity-50 transition-colors"
              >
                <NextIcon size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
