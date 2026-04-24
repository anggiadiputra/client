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
import CompactBatchActions from '../components/CompactBatchActions';

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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchCompanySettings();
  }, [page, statusFilter, searchTerm]);

  // Reset to page 1 whenever search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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

  const handleDeleteInvoice = async (invoice: any) => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      setDeletingId(invoice.id);
      try {
        await invoicesAPI.delete(invoice.id);
        fetchInvoices();
      } catch (error: any) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice: ' + (error.message || 'An error occurred'));
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} invoices?`)) return;
    
    setIsBatchLoading(true);
    try {
      await invoicesAPI.batchDelete(selectedIds);
      toast.success('Invoices deleted successfully');
      setSelectedIds([]);
      fetchInvoices();
    } catch (error: any) {
      console.error('Error batch deleting:', error);
      toast.error(error.message || 'Failed to delete invoices');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleBatchUpdateStatus = async (status: string) => {
    setIsBatchLoading(true);
    try {
      await invoicesAPI.batchUpdateStatus(selectedIds, status);
      toast.success(`Updated ${selectedIds.length} invoices to ${status}`);
      setSelectedIds([]);
      fetchInvoices();
    } catch (error: any) {
      console.error('Error batch updating status:', error);
      toast.error(error.message || 'Failed to update invoices');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map(i => i.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Daftar Invoice</h1>
          <p className="text-sm text-gray-500">Kelola dan lacak semua invoice pelanggan Anda</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari no. invoice atau customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
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

        <CompactBatchActions
          selectedCount={selectedIds.length}
          onDelete={handleBatchDelete}
          onUpdateStatus={handleBatchUpdateStatus}
          statusOptions={[
            { label: 'Draft', value: 'draft' },
            { label: 'Sent', value: 'sent' },
            { label: 'Paid', value: 'paid' },
            { label: 'Overdue', value: 'overdue' },
          ]}
          onClear={() => setSelectedIds([])}
          isLoading={isBatchLoading}
        />

        {!loading && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {totalItems} invoice{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <tr>
                      <th className="w-10 px-4 py-2">
                        <button 
                          onClick={toggleSelectAll}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          {selectedIds.length > 0 && selectedIds.length === invoices.length ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-2">No. Invoice</th>
                      <th className="px-4 py-2 hidden lg:table-cell">Pelanggan</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 hidden xl:table-cell">Jatuh Tempo</th>
                      <th className="px-4 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-xs italic">
                          {searchTerm || statusFilter ? 'Tidak ada invoice yang cocok.' : 'Belum ada invoice. Klik "Create Invoice" untuk mulai.'}
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <tr key={invoice.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(invoice.id) ? 'bg-blue-50/50' : ''}`}>
                          <td className="px-4 py-2">
                            <button 
                              onClick={() => toggleSelect(invoice.id)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              {selectedIds.includes(invoice.id) ? (
                                <CheckSquare size={16} className="text-blue-600" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 tabular-nums">
                            {invoice.invoice_number}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-gray-700 font-medium">{invoice.customer_name}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-black text-gray-900 tabular-nums">
                            {formatRupiah(parseFloat(String(invoice.grand_total ?? invoice.total_amount ?? 0)))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight border ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-500">
                            {formatDate(invoice.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleSendEmail(invoice.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-50 transition-colors" title="Email"><Mail size={16} /></button>
                              <button onClick={() => handleOpenWhatsApp(invoice)} className="p-1.5 text-green-600 hover:bg-green-50 rounded border border-green-50 transition-colors" title="WA"><WhatsAppIcon size={16} /></button>
                              <button onClick={() => handleViewInvoice(invoice)} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded border border-gray-50 transition-colors" title="View"><Eye size={16} /></button>
                              <button onClick={() => handleEditInvoice(invoice)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded border border-amber-50 transition-colors" title="Edit"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteInvoice(invoice)} disabled={deletingId === invoice.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-50 transition-colors disabled:opacity-40" title="Delete">
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
            <div className="md:hidden divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  {searchTerm || statusFilter ? 'No invoices match your filters.' : 'No invoices yet.'}
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div key={invoice.id} className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 mx-2 hover:shadow-md transition-all ${selectedIds.includes(invoice.id) ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' : ''}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <button 
                        onClick={() => toggleSelect(invoice.id)}
                        className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {selectedIds.includes(invoice.id) ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-50 flex items-center gap-1.5 px-2 py-0.5 rounded border border-gray-100">
                              <Hash size={10} className="text-gray-400" />
                              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">{invoice.invoice_number}</span>
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
                          <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                            <UserIcon size={12} className="text-blue-600" />
                          </div>
                          <h3 className="text-sm font-extrabold text-gray-900 truncate tracking-tight">{invoice.customer_name}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <Calendar size={12} className="text-gray-400" />
                          <span>Tempo: {formatDate(invoice.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                        <button onClick={() => handleSendEmail(invoice.id)} className="p-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Email"><Mail size={14} /></button>
                        <button onClick={() => handleOpenWhatsApp(invoice)} className="p-1.5 text-green-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="WA"><WhatsAppIcon size={14} /></button>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                        <button onClick={() => handleViewInvoice(invoice)} className="p-1.5 text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="View"><Eye size={14} /></button>
                        <button onClick={() => handleEditInvoice(invoice)} className="p-1.5 text-amber-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteInvoice(invoice)} disabled={deletingId === invoice.id} className="p-1.5 text-red-600 hover:bg-white hover:shadow-sm rounded-md transition-all disabled:opacity-40" title="Delete">
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
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
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
    </div>
  );
}
