import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, Edit2, Loader2, Mail, Search, ChevronLeft, ChevronRight, CheckSquare, Square, Hash, User as UserIcon, Calendar } from 'lucide-react';
import { invoicesAPI, emailsAPI } from '../lib/api';
import { formatRupiah, formatDate } from '../lib/formatter';
import SendWhatsAppModal from '../components/SendWhatsAppModal';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { SkeletonTable } from '../components/LoadingSkeleton';
import { toast } from '../components/Toast';
import { Invoice } from '../types';
import DropdownFilter from '../components/DropdownFilter';
import ConfirmDialog from '../components/ConfirmDialog';

const PAGE_SIZE = 10;

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    invoice: null as any
  });

  const fetchCompanySettings = async () => {
    try {
      const { settingsAPI } = await import('../lib/api');
      const data = await settingsAPI.get();
      setCompanySettings(data);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoicesAPI.getAll(page, PAGE_SIZE, statusFilter, searchTerm);
      // Backend returns { data, pagination } if paged
      if (data.data) {
        setInvoices(data.data);
        setTotalItems(data.pagination.total);
      } else {
        setInvoices(data);
        setTotalItems(data.length);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
      fetchCompanySettings();
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [page, statusFilter, searchTerm]);

  // Reset to page 1 whenever search or status changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);


  const handleSendEmail = async (invoiceId: number) => {
    try {
      await emailsAPI.sendInvoice(invoiceId);
      toast.success('Email sent successfully!');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'An error occurred while sending email');
    }
  };

  const handleOpenWhatsApp = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowWhatsAppModal(true);
  };

  const handleWhatsAppSuccess = () => {
    fetchInvoices();
  };

  const handleViewInvoice = (invoice: any) => {
    navigate(`/invoices/${invoice.invoice_number}/view`);
  };

  const handleEditInvoice = (invoice: any) => {
    navigate(`/invoices/${invoice.invoice_number}/edit`);
  };

  const handleDeleteInvoice = (invoice: any) => {
    setConfirmConfig({
      isOpen: true,
      invoice
    });
  };

  const confirmDelete = async () => {
    const invoice = confirmConfig.invoice;
    if (!invoice) return;

    setConfirmConfig({ ...confirmConfig, isOpen: false });
    setDeletingId(invoice.id);
    try {
      await invoicesAPI.delete(invoice.id);
      toast.success(`Invoice ${invoice.invoice_number} berhasil dihapus`);
      fetchInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast.error('Gagal menghapus invoice: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-500/15 text-green-800 border border-green-200 dark:text-green-400 dark:border-green-800/30';
      case 'sent':
        return 'bg-blue-500/15 text-blue-800 border border-blue-200 dark:text-blue-400 dark:border-blue-800/30';
      case 'overdue':
        return 'bg-red-500/15 text-red-800 border border-red-200 dark:text-red-400 dark:border-red-800/30';
      case 'draft':
      default:
        return 'bg-surface-2 text-tx-main border border-separator';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-tx-main mb-1">Daftar Invoice</h1>
          <p className="text-sm text-tx-muted">Kelola dan lacak semua invoice pelanggan Anda</p>
        </div>
        <button
          onClick={() => navigate('/invoices/create')}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={16} />
          Buat Invoice Baru
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle" size={16} />
            <input
              type="text"
              placeholder="Cari no. invoice atau customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-input-bg border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-tx-subtle"
            />
          </div>
          <DropdownFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'Draft', value: 'draft' },
              { label: 'Sent', value: 'sent' },
              { label: 'Paid', value: 'paid' },
              { label: 'Overdue', value: 'overdue' },
            ]}
          />
        </div>

        {!loading && (
          <span className="text-xs text-tx-subtle whitespace-nowrap">
            {totalItems} invoice{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-separator shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-2 border-b border-separator text-[10px] font-bold text-tx-subtle uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-2">No. Invoice</th>
                      <th className="px-4 py-2 hidden lg:table-cell">Pelanggan</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 hidden xl:table-cell">Jatuh Tempo</th>
                      <th className="px-4 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-tx-subtle text-xs italic">
                          {searchTerm || statusFilter ? 'Tidak ada invoice yang cocok.' : 'Belum ada invoice. Klik "Create Invoice" untuk mulai.'}
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-surface-2 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-tx-main tabular-nums">
                            {invoice.invoice_number}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-tx-muted font-medium">{invoice.customer_name}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-black text-tx-main tabular-nums">
                            {formatRupiah(parseFloat(String(invoice.grand_total ?? invoice.total_amount ?? 0)))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight border ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell text-xs text-tx-muted">
                            {formatDate(invoice.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleSendEmail(invoice.id)} className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded border border-blue-50 transition-colors" title="Email"><Mail size={16} /></button>
                              <button onClick={() => handleOpenWhatsApp(invoice)} className="p-1.5 text-green-600 hover:bg-green-500/10 rounded border border-green-50 transition-colors" title="WA"><WhatsAppIcon size={16} /></button>
                              <button onClick={() => handleViewInvoice(invoice)} className="p-1.5 text-tx-muted hover:bg-surface-2 rounded border border-separator transition-colors" title="View"><Eye size={16} /></button>
                              <button onClick={() => handleEditInvoice(invoice)} className="p-1.5 text-amber-600 hover:bg-amber-500/10 rounded border border-amber-50 transition-colors" title="Edit"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteInvoice(invoice)} disabled={deletingId === invoice.id} className="p-1.5 text-red-600 hover:bg-red-500/10 rounded border border-red-50 transition-colors disabled:opacity-40" title="Delete">
                                {deletingId === invoice.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden divide-y divide-separator">
              {invoices.length === 0 ? (
                <div className="px-6 py-8 text-center text-tx-muted">
                  {searchTerm || statusFilter ? 'No invoices match your filters.' : 'No invoices yet.'}
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 bg-surface rounded-xl shadow-sm border border-separator mb-3 mx-2 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-surface-2 flex items-center gap-1.5 px-2 py-0.5 rounded border border-separator">
                              <Hash size={10} className="text-tx-subtle" />
                              <span className="text-[10px] font-extrabold text-tx-muted uppercase tracking-wider">{invoice.invoice_number}</span>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </div>
                          <span className="text-sm font-extrabold text-blue-600">
                            {formatRupiah(parseFloat(String(invoice.grand_total ?? invoice.total_amount ?? 0)))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                            <UserIcon size={12} className="text-blue-600" />
                          </div>
                          <h3 className="text-sm font-extrabold text-tx-main truncate tracking-tight">{invoice.customer_name}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-tx-muted">
                          <Calendar size={12} className="text-tx-subtle" />
                          <span>Tempo: {formatDate(invoice.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-separator">
                      <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg">
                        <button onClick={() => handleSendEmail(invoice.id)} className="p-1.5 text-blue-600 hover:bg-surface hover:shadow-sm rounded-md transition-all" title="Email"><Mail size={14} /></button>
                        <button onClick={() => handleOpenWhatsApp(invoice)} className="p-1.5 text-green-600 hover:bg-surface hover:shadow-sm rounded-md transition-all" title="WA"><WhatsAppIcon size={14} /></button>
                      </div>
                      <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg">
                        <button onClick={() => handleViewInvoice(invoice)} className="p-1.5 text-tx-muted hover:bg-surface hover:shadow-sm rounded-md transition-all" title="View"><Eye size={14} /></button>
                        <button onClick={() => handleEditInvoice(invoice)} className="p-1.5 text-amber-600 hover:bg-surface hover:shadow-sm rounded-md transition-all" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteInvoice(invoice)} disabled={deletingId === invoice.id} className="p-1.5 text-red-600 hover:bg-surface hover:shadow-sm rounded-md transition-all disabled:opacity-40" title="Delete">
                          {deletingId === invoice.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-tx-muted">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-tx-muted border border-separator rounded-lg disabled:opacity-40 hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-tx-muted hover:bg-surface-2 border border-separator'}`}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-tx-muted border border-separator rounded-lg disabled:opacity-40 hover:bg-surface-2 transition-colors"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Send WhatsApp Modal */}
      {showWhatsAppModal && selectedInvoice && (
        <SendWhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          invoice={selectedInvoice}
          customer={{
            name: selectedInvoice.customer_name || 'Customer',
            phone: selectedInvoice.customer_phone || '',
          }}
          companySettings={companySettings ? {
            company_name: companySettings.company_name,
            company_phone: companySettings.company_phone,
            company_email: companySettings.company_email,
            wa_invoice_template: companySettings.wa_invoice_template,
          } : undefined}
          onSuccess={handleWhatsAppSuccess}
        />
      )}

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title="Hapus Invoice"
        message={`Apakah Anda yakin ingin menghapus invoice ${confirmConfig.invoice?.invoice_number}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
