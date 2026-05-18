import { useEffect, useState } from 'react';
import { TrendingUp, FileText, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { invoicesAPI, logsAPI } from '../lib/api';
import { SkeletonStatsCards } from '../components/LoadingSkeleton';
import { useAppSettings } from '../context/AppContext';
import { DashboardStats, MonthlyData, DashboardLog, Invoice } from '../types';
import { formatDate } from '../lib/formatter';

export default function DashboardPage() {
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentLogs, setRecentLogs] = useState<DashboardLog[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [summary, monthly, logs, invoicesData] = await Promise.all([
        invoicesAPI.getStats(),
        invoicesAPI.getMonthlyStats(),
        logsAPI.getRecent(),
        invoicesAPI.getAll(1, 5)
      ]);
      setStats(summary);
      setMonthlyData(monthly || []);
      setRecentLogs(logs || []);
      const invoicesList = invoicesData.data || invoicesData || [];
      setRecentInvoices(Array.isArray(invoicesList) ? invoicesList.slice(0, 5) : []);
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
      color: 'bg-green-500/100',
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
      color: 'bg-blue-500/100',
    },
    {
      label: 'Total Invoices',
      value: stats?.total_invoices || 0,
      icon: FileText,
      color: 'bg-purple-500/100',
    },
  ];

  // Logic for Simple Bar Chart
  const maxAmount = Math.max(
    ...monthlyData.map(d => Math.max(parseFloat(String(d.paid_amount)) || 0, parseFloat(String(d.unpaid_amount)) || 0)),
    1000000
  );
  const chartHeight = 180;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-500/15 text-green-800 border border-green-200';
      case 'sent':
        return 'bg-blue-500/15 text-blue-800 border border-blue-200';
      case 'overdue':
        return 'bg-red-500/15 text-red-800 border border-red-200';
      case 'draft':
      default:
        return 'bg-surface-2 text-tx-main border border-separator';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tx-main mb-1">Dashboard</h1>
        <p className="text-sm text-tx-muted">Selamat datang di {settings.appName}. Berikut adalah ringkasan bisnis Anda.</p>
      </div>

      {loading ? (
        <SkeletonStatsCards count={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-surface rounded-lg shadow-sm border border-separator p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-tx-muted uppercase tracking-wider">{card.label}</p>
                      <p className="text-2xl font-bold text-tx-main mt-2">{card.value}</p>
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
            <div className="bg-surface rounded-xl shadow-sm border border-separator p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-tx-main">Pendapatan 6 Bulan Terakhir</h2>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500/100 rounded-sm"></div>
                    <span className="text-[10px] font-bold text-tx-subtle uppercase">Paid</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
                    <span className="text-[10px] font-bold text-tx-subtle uppercase">Pending</span>
                  </div>
                </div>
              </div>
              
              {monthlyData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-tx-subtle">
                  Belum ada data pendapatan.
                </div>
              ) : (
                <div className="flex-1 flex items-end justify-between gap-1 pt-4 pb-0 border-b border-separator">
                  {monthlyData.map((data, idx) => {
                    const paid = parseFloat(String(data.paid_amount)) || 0;
                    const unpaid = parseFloat(String(data.unpaid_amount)) || 0;
                    const paidHeight = (paid / maxAmount) * chartHeight;
                    const unpaidHeight = (unpaid / maxAmount) * chartHeight;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                        <div className="flex items-end gap-[2px] w-full justify-center">
                          <div 
                            style={{ height: `${paidHeight}px` }}
                            className="w-[12px] sm:w-[18px] bg-blue-500/100 rounded-t-sm transition-all relative group/paid"
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
                        <div className="mt-4 text-[10px] font-bold text-tx-subtle">{data.month}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notification Activity Section */}
            <div className="bg-surface rounded-xl shadow-sm border border-separator p-6 flex flex-col h-full">
              <h2 className="text-lg font-bold text-tx-main mb-6 flex items-center justify-between">
                Aktivitas Notifikasi
                <span className="text-xs font-normal text-blue-600 cursor-pointer hover:underline" onClick={() => navigate('/logs')}>Lihat Semua</span>
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2 scrollbar-thin">
                {recentLogs.length === 0 ? (
                  <div className="py-12 text-center text-tx-subtle">
                    <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
                    <p className="text-sm">Belum ada aktivitas pengiriman.</p>
                  </div>
                ) : (
                  recentLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors border border-transparent hover:border-separator">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${log.type === 'whatsapp' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {log.type === 'whatsapp' ? <WhatsAppIcon size={16} /> : <Mail size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-tx-main truncate">
                              {log.target || log.recipient}
                            </p>
                            <span className="text-[10px] text-tx-subtle font-medium ml-2 shrink-0">
                              {new Date(log.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-tx-muted font-medium truncate mt-0.5">
                            {log.type === 'whatsapp' ? (log.message_type === 'invoice_auto' ? 'Invoice Otomatis' : 'Invoice Manual') : log.subject}
                          </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'sent' || log.status === 'success' ? 'bg-green-500/100' : 'bg-red-500/100'}`}></div>
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

          {/* Recent Invoices Section */}
          <div className="mt-6 bg-surface rounded-xl shadow-sm border border-separator p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-tx-main">Invoice Terbaru</h2>
              <span className="text-xs font-normal text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/invoices')}>Lihat Semua</span>
            </div>
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-2 border-b border-separator text-[10px] font-bold text-tx-subtle uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">No. Invoice</th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">Jatuh Tempo</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-tx-subtle text-sm">
                        Belum ada invoice.
                      </td>
                    </tr>
                  ) : (
                    recentInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => navigate(`/invoices/${invoice.invoice_number}/view`)}>
                        <td className="px-4 py-3 text-sm font-bold text-tx-main tabular-nums">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-tx-muted font-medium">{invoice.customer_name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-tx-muted">
                          {formatDate(invoice.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-black text-tx-main tabular-nums">
                          {formatIDR(parseFloat(String(invoice.grand_total ?? invoice.total_amount ?? 0)))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight border ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-separator pt-2">
              {recentInvoices.length === 0 ? (
                <div className="py-8 text-center text-tx-subtle text-sm">Belum ada invoice.</div>
              ) : (
                recentInvoices.map((invoice) => (
                  <div 
                    key={invoice.id} 
                    onClick={() => navigate(`/invoices/${invoice.invoice_number}/view`)}
                    className="py-3.5 px-1 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-black text-tx-main tracking-tight">{invoice.invoice_number}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tight border ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-tx-muted truncate">{invoice.customer_name}</p>
                      <p className="text-xs text-tx-subtle mt-0.5">{formatDate(invoice.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-tx-main tabular-nums">{formatIDR(parseFloat(String(invoice.grand_total ?? invoice.total_amount ?? 0)))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
