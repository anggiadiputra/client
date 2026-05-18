import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Clock, CheckCircle, User, FileText } from 'lucide-react';
import { whatsappAPI } from '../lib/api';
import { SkeletonBlock } from '../components/LoadingSkeleton';

export default function WhatsAppLogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLog = async () => {
    if (!id) return;
    try {
      const data = await whatsappAPI.getById(id);
      setLog(data);
    } catch (error) {
      console.error('Error fetching log:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
  }, [id]);

  if (loading) return (
    <div className="p-8 bg-surface-2 min-h-screen">
      <SkeletonBlock width="100px" height="24px" className="mb-8" />
      <div className="max-w-3xl bg-surface rounded-3xl border border-separator shadow-sm p-8">
        <div className="flex items-center gap-4 mb-8">
          <SkeletonBlock width="56px" height="56px" rounded />
          <div>
            <SkeletonBlock width="200px" height="32px" className="mb-2" />
            <SkeletonBlock width="120px" height="20px" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <SkeletonBlock width="100%" height="40px" />
            <SkeletonBlock width="100%" height="40px" />
          </div>
          <div className="space-y-6">
            <SkeletonBlock width="100%" height="40px" />
            <SkeletonBlock width="100%" height="40px" />
          </div>
        </div>
        <SkeletonBlock width="100%" height="64px" rounded />
      </div>
    </div>
  );
  if (!log) return <div className="p-8 text-center">Log tidak ditemukan.</div>;

  return (
    <div className="p-8 bg-surface-2 min-h-screen">
      <button onClick={() => navigate('/logs/whatsapp')} className="flex items-center gap-2 text-tx-muted mb-8 hover:text-tx-main">
        <ChevronLeft size={20} /> Kembali
      </button>

      <div className="max-w-3xl bg-surface rounded-3xl border border-separator shadow-sm p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-green-500/100 p-3 rounded-2xl text-white">
            <MessageCircle size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-tx-main">WhatsApp Log Detail</h1>
            <p className="text-tx-muted">ID Log: #{log.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-tx-subtle uppercase tracking-widest block mb-1">Penerima</label>
              <div className="flex items-center gap-2 text-tx-main font-bold">
                <User size={18} className="text-tx-subtle" />
                {log.customer_name || 'Pelanggan'} ({log.target})
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-tx-subtle uppercase tracking-widest block mb-1">Status</label>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/15 text-green-700 font-bold text-sm">
                <CheckCircle size={16} /> {log.status.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-tx-subtle uppercase tracking-widest block mb-1">Waktu Kirim</label>
              <div className="flex items-center gap-2 text-tx-main font-medium">
                <Clock size={18} className="text-tx-subtle" />
                {new Date(log.sent_at).toLocaleString('id-ID')}
              </div>
            </div>
            {log.invoice_number && (
              <div>
                <label className="text-xs font-bold text-tx-subtle uppercase tracking-widest block mb-1">Invoice Terkait</label>
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                  <FileText size={18} />
                  #{log.invoice_number}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-tx-subtle uppercase tracking-widest block mb-3">Pesan Dikirim</label>
          <div className="bg-surface-2 rounded-2xl p-6 border border-separator whitespace-pre-wrap text-tx-muted font-medium text-sm leading-relaxed">
            {log.message || '(Pesan tidak tersimpan dalam log database)'}
          </div>
        </div>
      </div>
    </div>
  );
}
