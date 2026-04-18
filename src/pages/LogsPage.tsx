import { TrendingUp, MessageCircle, Mail, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function LogsPage() {
  const navigate = useNavigate();

  const categories = [
    {
      title: 'WhatsApp Logs',
      description: 'Riwayat pengiriman notifikasi invoice melalui WhatsApp.',
      path: '/logs/whatsapp',
      icon: WhatsAppIcon,
      color: 'bg-green-500',
      stats: 'Fonnte API',
    },
    {
      title: 'Email Logs',
      description: 'Riwayat pengiriman notifikasi invoice melalui Email (SMTP/Brevo).',
      path: '/logs/emails',
      icon: Mail,
      color: 'bg-blue-500',
      stats: 'SMTP Server',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Log History</h1>
        <p className="text-sm text-gray-500">Pilih kategori log untuk melihat rincian pengiriman notifikasi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div 
              key={idx} 
              onClick={() => navigate(cat.path)}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${cat.color} p-2.5 rounded-lg text-white`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded">{cat.stats}</span>
              </div>
              
              <h2 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{cat.title}</h2>
              <p className="text-sm text-gray-500 mb-4">{cat.description}</p>
              
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Buka Log <Clock size={14} className="ml-1.5" />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 mb-1.5 flex items-center gap-2">
          <AlertCircle size={15} />
          Informasi Logging
        </h3>
        <p className="text-sm text-blue-700">
          Sistem secara otomatis mencatat setiap pengiriman invoice baik yang dilakukan secara manual maupun otomatis (saat status menjadi Paid/Sent). Data log mencakup status pengiriman dari provider (Fonnte/SMTP) untuk memudahkan pelacakan jika terjadi kegagalan.
        </p>
      </div>
    </div>
  );
}
