import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, Edit2, Loader2, Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { invoicesAPI, emailsAPI } from '../lib/api';
import { formatRupiah, formatDate } from '../lib/formatter';
import SendWhatsAppModal from '../components/SendWhatsAppModal';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { SkeletonTable } from '../components/LoadingSkeleton';
import { toast } from '../components/Toast';
import { Invoice } from '../types';

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
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchInvoices();
    fetchCompanySettings();
  }, []);

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
    try {
      const data = await invoicesAPI.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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
    navigate(`/invoices/${invoice.invoice_number}`);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.draft;
  };

  // Client-side filtering
  const filtered = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Invoices</h1>
          <p className="text-sm text-gray-500">Manage and track all your client invoices</p>
        </div>
        <button
          onClick={() => navigate('/invoices/create')}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search invoice no., customer, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        {!loading && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No invoices match your search.' : 'No invoices yet. Click "Create Invoice" to get started.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{invoice.invoice_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-gray-700">{invoice.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatRupiah(parseFloat(String(invoice.grand_total ?? invoice.total_amount ?? 0)))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap hidden xl:table-cell">
                        {formatDate(invoice.due_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleSendEmail(invoice.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Send via Email"><Mail size={16} /></button>
                          <button onClick={() => handleOpenWhatsApp(invoice)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Send WhatsApp"><WhatsAppIcon size={16} /></button>
                          <button onClick={() => handleViewInvoice(invoice)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View"><Eye size={16} /></button>
                          <button onClick={() => handleEditInvoice(invoice)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteInvoice(invoice)} disabled={deletingId === invoice.id} className="p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors" title="Delete">
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
            {paginated.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                {searchTerm ? 'No invoices match your search.' : 'No invoices yet.'}
              </div>
            ) : (
              paginated.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400 capitalize">{invoice.invoice_number}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 truncate">{invoice.customer_name}</h3>
                      <p className="text-[11px] text-gray-500 mt-1">Due: {formatDate(invoice.due_date, { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className="text-sm font-bold text-blue-600">
                        {formatRupiah(parseFloat(String(invoice.grand_total ?? invoice.total_amount ?? 0)))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleSendEmail(invoice.id)} className="p-2 text-blue-600 bg-blue-50 rounded-lg" title="Email"><Mail size={16} /></button>
                      <button onClick={() => handleOpenWhatsApp(invoice)} className="p-2 text-green-600 bg-green-50 rounded-lg" title="WA"><WhatsAppIcon size={16} /></button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleViewInvoice(invoice)} className="p-2 text-gray-600 bg-gray-50 rounded-lg" title="View"><Eye size={16} /></button>
                      <button onClick={() => handleEditInvoice(invoice)} className="p-2 text-amber-600 bg-amber-50 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteInvoice(invoice)} disabled={deletingId === invoice.id} className="p-2 text-red-600 bg-red-50 rounded-lg" title="Delete">
                        {deletingId === invoice.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
