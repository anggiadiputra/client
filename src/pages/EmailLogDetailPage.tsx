import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Clock, CheckCircle, User, FileText } from 'lucide-react';
import { emailsAPI } from '../lib/api';
import { SkeletonBlock } from '../components/LoadingSkeleton';

export default function EmailLogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLog = async () => {
    if (!id) return;
    try {
      const data = await emailsAPI.getById(id);
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
      <button onClick={() => navigate('/logs/emails')} className="flex items-center gap-2 text-tx-muted mb-8 hover:text-tx-main">
        <ChevronLeft size={20} /> Kembali
      </button>

      <div className="max-w-3xl bg-surface rounded-3xl border border-separator shadow-sm p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl text-white">
            <Mail size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-tx-main">Email Log Detail</h1>
            <p className="text-tx-muted">ID Log: #{log.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-tx-subtle uppercase tracking-widest block mb-1">Penerima</label>
              <div className="flex items-center gap-2 text-tx-main font-bold overflow-hidden">
                <User size={18} className="text-tx-subtle flex-shrink-0" />
                <span className="truncate">{log.recipient}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-tx-subtle uppercase tracking-widest block mb-1">Status</label>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 font-bold text-sm">
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
          <label className="text-xs font-bold text-tx-subtle uppercase tracking-widest block mb-3">Subjek Email</label>
          <div className="bg-surface-2 rounded-2xl p-4 border border-separator text-tx-muted font-bold text-lg mb-6">
            {log.subject || '(Tidak ada subjek)'}
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-xs flex gap-2">
          <Clock size={16} className="shrink-0" />
          Konten body HTML email tidak disimpan secara penuh di log database untuk menghemat ruang penyimpanan.
        </div>
      </div>
    </div>
  );
}
