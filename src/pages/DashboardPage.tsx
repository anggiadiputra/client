import { useEffect, useState } from 'react';
import { TrendingUp, FileText, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { invoicesAPI, logsAPI } from '../lib/api';
import { SkeletonStatsCards } from '../components/LoadingSkeleton';
import { useAppSettings } from '../context/AppContext';
import { DashboardStats, MonthlyData, DashboardLog } from '../types';

export default function DashboardPage() {
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentLogs, setRecentLogs] = useState<DashboardLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [summary, monthly, logs] = await Promise.all([
        invoicesAPI.getStats(),
        invoicesAPI.getMonthlyStats(),
        logsAPI.getRecent()
      ]);
      setStats(summary);
      setMonthlyData(monthly || []);
      setRecentLogs(logs || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatIDR = (value: number | string) => {
    const val = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const statCards = [
    {
      label: 'Total Omset',
      value: stats?.total_income ? formatIDR(stats.total_income) : formatIDR(0),
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Tagihan Pending',
      value: stats?.total_pending ? formatIDR(stats.total_pending) : formatIDR(0),
      icon: FileText,
      color: 'bg-yellow-500',
    },
    {
      label: 'Sudah Dibayar',
      value: stats?.total_paid ? formatIDR(stats.total_paid) : formatIDR(0),
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Invoices',
      value: stats?.total_invoices || 0,
      icon: FileText,
      color: 'bg-purple-500',
    },
  ];

  // Logic for Simple Bar Chart
  const maxAmount = Math.max(
    ...monthlyData.map(d => Math.max(parseFloat(d.paid_amount) || 0, parseFloat(d.unpaid_amount) || 0)),
    1000000
  );
  const chartHeight = 180;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-500">Selamat datang di {settings.appName}. Berikut adalah ringkasan bisnis Anda.</p>
      </div>

      {loading ? (
        <SkeletonStatsCards count={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                    </div>
                    <div className={`${card.color} p-3 rounded-lg text-white`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simple Bar Chart Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">Pendapatan 6 Bulan Terakhir</h2>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Paid</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Pending</span>
                  </div>
                </div>
              </div>
              
              {monthlyData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  Belum ada data pendapatan.
                </div>
              ) : (
                <div className="flex-1 flex items-end justify-between gap-1 pt-4 pb-0 border-b border-gray-100">
                  {monthlyData.map((data, idx) => {
                    const paid = parseFloat(data.paid_amount) || 0;
                    const unpaid = parseFloat(data.unpaid_amount) || 0;
                    const paidHeight = (paid / maxAmount) * chartHeight;
                    const unpaidHeight = (unpaid / maxAmount) * chartHeight;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                        <div className="flex items-end gap-[2px] w-full justify-center">
                          <div 
                            style={{ height: `${paidHeight}px` }}
                            className="w-[12px] sm:w-[18px] bg-blue-500 rounded-t-sm transition-all relative group/paid"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/paid:opacity-100 whitespace-nowrap z-20">
                              Lunas: {formatIDR(paid)}
                            </div>
                          </div>
                          <div 
                            style={{ height: `${unpaidHeight}px` }}
                            className="w-[12px] sm:w-[18px] bg-red-400 rounded-t-sm transition-all relative group/unpaid"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/unpaid:opacity-100 whitespace-nowrap z-20">
                              Tertunda: {formatIDR(unpaid)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-[10px] font-bold text-gray-400">{data.month}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notification Activity Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center justify-between">
                Aktivitas Notifikasi
                <span className="text-xs font-normal text-blue-600 cursor-pointer hover:underline" onClick={() => navigate('/logs')}>Lihat Semua</span>
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2 scrollbar-thin">
                {recentLogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
                    <p className="text-sm">Belum ada aktivitas pengiriman.</p>
                  </div>
                ) : (
                  recentLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${log.type === 'whatsapp' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {log.type === 'whatsapp' ? <WhatsAppIcon size={16} /> : <Mail size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {log.target || log.recipient}
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium ml-2 shrink-0">
                            {new Date(log.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                          {log.type === 'whatsapp' ? (log.message_type === 'invoice_auto' ? 'Invoice Otomatis' : 'Invoice Manual') : log.subject}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'sent' || log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-[10px] font-bold uppercase ${log.status === 'sent' || log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {log.status === 'sent' || log.status === 'success' ? 'Berhasil' : 'Gagal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
