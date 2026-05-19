import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, FileText, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { invoicesAPI } from '../lib/api';
import { formatRupiah } from '../lib/formatter';

interface DailyData {
  date: string;
  total_invoices: string | number;
  paid_amount: string | number;
  pending_amount: string | number;
  paid_count: string | number;
  pending_count: string | number;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const WEEK_OPTIONS = [
  { label: 'Semua', value: 0 },
  { label: 'Minggu 1', value: 1 },
  { label: 'Minggu 2', value: 2 },
  { label: 'Minggu 3', value: 3 },
  { label: 'Minggu 4', value: 4 },
  { label: 'Minggu 5', value: 5 },
];

function getWeekRange(week: number): [number, number] {
  if (week === 0) return [1, 31];
  const start = (week - 1) * 7 + 1;
  const end = week === 5 ? 31 : week * 7;
  return [start, end];
}

export default function RevenuePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [weekFilter, setWeekFilter] = useState(0);
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const rows = await invoicesAPI.getDailyStats(year, month);
      setData(rows || []);
    } catch (e) {
      console.error('Error fetching daily stats:', e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const filteredData = useMemo(() => {
    if (weekFilter === 0) return data;
    const [start, end] = getWeekRange(weekFilter);
    return data.filter(row => {
      const day = new Date(row.date).getDate();
      return day >= start && day <= end;
    });
  }, [data, weekFilter]);

  const summary = useMemo(() => {
    const totalPaid = filteredData.reduce((sum, r) => sum + parseFloat(String(r.paid_amount)), 0);
    const totalPending = filteredData.reduce((sum, r) => sum + parseFloat(String(r.pending_amount)), 0);
    const totalInvoices = filteredData.reduce((sum, r) => sum + parseInt(String(r.total_invoices)), 0);
    const paidDays = filteredData.filter(r => parseFloat(String(r.paid_amount)) > 0).length;
    const avgPerDay = paidDays > 0 ? totalPaid / paidDays : 0;
    return { totalPaid, totalPending, totalInvoices, avgPerDay };
  }, [filteredData]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setWeekFilter(0);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setWeekFilter(0);
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDayOfWeek = (dateStr: string) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[new Date(dateStr).getDay()];
  };

  const isWeekend = (dateStr: string) => {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  };

  const summaryCards = [
    { label: 'Total Lunas', value: formatRupiah(summary.totalPaid), icon: TrendingUp, color: 'bg-green-500/100' },
    { label: 'Total Pending', value: formatRupiah(summary.totalPending), icon: TrendingDown, color: 'bg-yellow-500' },
    { label: 'Total Invoice', value: String(summary.totalInvoices), icon: FileText, color: 'bg-blue-500/100' },
    { label: 'Rata-rata/Hari', value: formatRupiah(summary.avgPerDay), icon: BarChart2, color: 'bg-purple-500/100' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tx-main mb-1">Laporan Pendapatan</h1>
        <p className="text-sm text-tx-muted">Pantau pendapatan harian Anda berdasarkan invoice yang telah dibayar.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-surface rounded-lg shadow-sm border border-separator p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-tx-muted uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-tx-main mt-2">{loading ? '—' : card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter + Table */}
      <div className="bg-surface rounded-lg border border-separator shadow-sm overflow-hidden">

        {/* Toolbar */}
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b border-separator bg-surface-2">
          {/* Month Navigator */}
          <div className="flex items-center justify-between md:justify-start gap-2">
            <button
              onClick={prevMonth}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-tx-muted border border-separator rounded-lg hover:bg-surface transition-colors"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <div className="flex items-center gap-2 min-w-[130px] sm:min-w-[140px] justify-center">
              <Calendar size={14} className="text-blue-500 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-tx-main truncate">
                {MONTHS[month - 1]} {year}
              </span>
            </div>
            <button
              onClick={nextMonth}
              disabled={year === now.getFullYear() && month === now.getMonth() + 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-tx-muted border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-40"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>

          {/* Week Filter */}
          <div className="flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
            {WEEK_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setWeekFilter(opt.value)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors border ${
                  weekFilter === opt.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-surface text-tx-muted border-separator hover:bg-surface-2'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table content */}
        {loading ? (
          <div className="divide-y divide-separator">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-6 animate-pulse">
                <div className="w-8 h-3 bg-surface-2 rounded" />
                <div className="w-32 h-3 bg-surface-2 rounded" />
                <div className="flex-1 h-3 bg-surface-2 rounded" />
                <div className="w-24 h-3 bg-surface-2 rounded" />
                <div className="w-16 h-3 bg-surface-2 rounded" />
              </div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="px-4 py-12 text-center text-tx-subtle text-xs italic">
            Tidak ada data untuk periode ini.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-2 border-b border-separator text-[10px] font-bold text-tx-subtle uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-2">Hari</th>
                    <th className="px-4 py-2">Tanggal</th>
                    <th className="px-4 py-2 text-right">Pendapatan (Lunas)</th>
                    <th className="px-4 py-2 text-right">Tagihan Pending</th>
                    <th className="px-4 py-2 text-center">Inv. Lunas</th>
                    <th className="px-4 py-2 text-center">Inv. Pending</th>
                    <th className="px-4 py-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {filteredData.map((row) => {
                    const paid = parseFloat(String(row.paid_amount));
                    const pending = parseFloat(String(row.pending_amount));
                    const total = parseInt(String(row.total_invoices));

                    return (
                      <tr key={row.date} className="hover:bg-surface-2 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-[4px] ${
                            isWeekend(row.date)
                              ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                              : 'bg-surface-2 text-tx-muted border border-separator'
                          }`}>
                            {getDayOfWeek(row.date)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-tx-muted">
                          {formatDay(row.date)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {paid > 0
                            ? <span className="text-sm font-bold text-tx-main">{formatRupiah(paid)}</span>
                            : <span className="text-sm text-tx-subtle">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {pending > 0
                            ? <span className="text-sm text-tx-muted">{formatRupiah(pending)}</span>
                            : <span className="text-sm text-tx-subtle">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          {parseInt(String(row.paid_count)) > 0
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight border bg-green-500/15 text-green-800 border-green-200 dark:text-green-400 dark:border-green-800/30">{row.paid_count}</span>
                            : <span className="text-tx-subtle text-sm">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          {parseInt(String(row.pending_count)) > 0
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight border bg-surface-2 text-tx-main border-separator">{row.pending_count}</span>
                            : <span className="text-tx-subtle text-sm">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-tx-muted">
                          {total > 0 ? total : <span className="text-tx-subtle">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-separator bg-surface-2">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-xs font-extrabold text-tx-muted uppercase tracking-wider">
                      Total {weekFilter > 0 ? `Minggu ${weekFilter}` : MONTHS[month - 1]}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-extrabold text-tx-main tabular-nums">
                      {formatRupiah(summary.totalPaid)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-tx-muted tabular-nums">
                      {formatRupiah(summary.totalPending)}
                    </td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-tx-muted">
                      {filteredData.reduce((s, r) => s + parseInt(String(r.paid_count)), 0)}
                    </td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-tx-muted">
                      {filteredData.reduce((s, r) => s + parseInt(String(r.pending_count)), 0)}
                    </td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-tx-muted">
                      {summary.totalInvoices}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-separator">
              {filteredData.filter(r => parseInt(String(r.total_invoices)) > 0).length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-tx-subtle italic">
                  Tidak ada transaksi pada periode ini.
                </div>
              ) : (
                filteredData
                  .filter(r => parseInt(String(r.total_invoices)) > 0)
                  .map(row => {
                    const paid = parseFloat(String(row.paid_amount));
                    const pending = parseFloat(String(row.pending_amount));
                    return (
                      <div key={row.date} className="px-4 py-3.5 space-y-1.5 bg-surface hover:bg-surface-2 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-[4px] border ${
                              isWeekend(row.date) ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-surface-2 text-tx-muted border-separator'
                            }`}>{getDayOfWeek(row.date)}</span>
                            <span className="text-sm font-bold text-tx-main">{formatDay(row.date)}</span>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-surface-2 text-tx-muted border border-separator">{row.total_invoices} inv</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-1.5 font-bold text-tx-main">
                            <span className="text-[11px] text-tx-subtle uppercase tracking-wider font-medium">Lunas:</span>
                            <span>{paid > 0 ? formatRupiah(paid) : 'Rp 0'}</span>
                          </div>
                          {pending > 0 && (
                            <div className="flex items-center gap-1 text-xs font-medium text-tx-muted">
                              <span className="text-tx-subtle">Pending:</span>
                              <span>{formatRupiah(pending)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Mobile Summary Footer */}
            <div className="md:hidden bg-surface-2 p-4 border-t border-separator space-y-2">
              <div className="text-[10px] font-black text-tx-muted uppercase tracking-wider border-b border-separator pb-1.5">
                Ringkasan {weekFilter > 0 ? `Minggu ${weekFilter}` : MONTHS[month - 1]}
              </div>
              <div className="flex justify-between items-center text-sm font-extrabold text-tx-main">
                <span className="text-xs font-medium text-tx-muted">Total Lunas ({filteredData.reduce((s, r) => s + parseInt(String(r.paid_count)), 0)} inv):</span>
                <span className="font-black text-green-600 dark:text-green-500">{formatRupiah(summary.totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-tx-muted">
                <span className="text-xs font-medium text-tx-subtle">Total Pending ({filteredData.reduce((s, r) => s + parseInt(String(r.pending_count)), 0)} inv):</span>
                <span>{formatRupiah(summary.totalPending)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
