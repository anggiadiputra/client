import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, ChevronLeft as PrevIcon, ChevronRight as NextIcon, Loader2 } from 'lucide-react';
import { whatsappAPI } from '../lib/api';

interface WhatsAppLog {
  id: number;
  target: string;
  message_type: string;
  invoice_number?: string;
  invoice_id?: number;
  status: string;
  error_message?: string;
  sent_at: string;
  customer_name?: string;
}

export default function WhatsAppLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await whatsappAPI.getAll(page, 15);
      setLogs(data.logs || []);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'sent':
      case 'success':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle };
      case 'failed':
      case 'error':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle };
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle };
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/logs')}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 mb-2 text-sm font-medium"
        >
          <ChevronLeft size={15} /> Kembali ke History
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">WhatsApp Logs</h1>
        <p className="text-sm text-gray-500">Total {totalItems} riwayat pengiriman.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tujuan</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipe / Invoice</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 size={32} className="animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">
                    Belum ada riwayat pengiriman.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const style = getStatusStyle(log.status);
                  const Icon = style.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{log.target}</div>
                        <div className="text-xs text-gray-500">WA Gateway</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          <Icon size={12} />
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{log.message_type === 'invoice_auto' ? 'Otomatis' : 'Manual'}</div>
                        {log.invoice_number && (
                          <div className="text-xs text-blue-600">#{log.invoice_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatDate(log.sent_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => navigate(`/logs/whatsapp/${log.id}`)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Halaman <span className="font-semibold text-gray-900">{page}</span> dari <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <PrevIcon size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
