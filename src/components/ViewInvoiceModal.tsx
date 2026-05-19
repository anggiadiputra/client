import { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import KeyboardShortcutWrapper from './KeyboardShortcutWrapper';
import { invoicesAPI } from '../lib/api';

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
}

export default function ViewInvoiceModal({ isOpen, onClose, invoiceId }: ViewInvoiceModalProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoice();
    }
  }, [isOpen, invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const data = await invoicesAPI.getById(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-surface-2 text-tx-main border border-separator',
      sent: 'bg-blue-500/15 text-blue-800 border border-blue-200 dark:text-blue-400 dark:border-blue-800/30',
      paid: 'bg-green-500/15 text-green-800 border border-green-200 dark:text-green-400 dark:border-green-800/30',
      overdue: 'bg-red-500/15 text-red-800 border border-red-200 dark:text-red-400 dark:border-red-800/30',
    };
    return colors[status] || colors.draft;
  };

  // Determine display preferences - for old invoices, auto-detect from items
  const showDiscount = invoice?.show_discount ?? invoice?.items?.some((item: any) => item.discount > 0) ?? false;
  const showTax = invoice?.show_tax ?? invoice?.items?.some((item: any) => item.tax_rate > 0) ?? false;

  if (!isOpen) return null;

  return (
    <KeyboardShortcutWrapper onClose={onClose}>
      <div className="bg-surface rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-separator">
          <div>
            <h2 className="text-xl font-bold text-tx-main">Detail Invoice</h2>
            {invoice && <p className="text-sm text-tx-muted mt-1">{invoice.invoice_number}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-tx-muted hover:text-tx-main hover:bg-surface-2 rounded-lg transition-colors">
              <Printer size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-tx-subtle hover:text-tx-muted transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-tx-muted mb-2">Informasi Invoice</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-tx-muted">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>{invoice.status}</span></p>
                    <p><span className="text-tx-muted">Tanggal Issue:</span> {new Date(invoice.issue_date).toLocaleDateString('id-ID')}</p>
                    <p><span className="text-tx-muted">Jatuh Tempo:</span> {new Date(invoice.due_date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-tx-muted mb-2">Customer</h3>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{invoice.customer_name}</p>
                    <p className="text-tx-muted">{invoice.customer_email}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-tx-muted mb-3">Item Layanan</h3>
                <div className="border border-separator rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-2">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-tx-muted">Deskripsi</th>
                        <th className="text-right px-4 py-3 font-semibold text-tx-muted">Qty</th>
                        <th className="text-right px-4 py-3 font-semibold text-tx-muted">Harga</th>
                        {showDiscount && <th className="text-right px-4 py-3 font-semibold text-tx-muted">Diskon</th>}
                        <th className="text-right px-4 py-3 font-semibold text-tx-muted">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-separator">
                      {invoice.items?.map((item: any, index: number) => {
                        const lineTotal = item.quantity * item.unit_price;
                        const discountAmount = showDiscount ? lineTotal * ((item.discount || 0) / 100) : 0;
                        const itemTotal = lineTotal - discountAmount;
                        
                        return (
                          <tr key={index}>
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                            {showDiscount && <td className="px-4 py-3 text-right">{item.discount > 0 ? `${item.discount}%` : '-'}</td>}
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(itemTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-tx-muted">Subtotal:</span>
                    <span>{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  {showTax && invoice.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-tx-muted">Pajak:</span>
                      <span>{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-separator pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(invoice.total_amount + (showTax ? invoice.tax_amount : 0))}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-tx-muted mb-2">Catatan</h3>
                  <p className="text-sm text-tx-muted bg-surface-2 p-4 rounded-lg">{invoice.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-tx-muted">
              Invoice tidak ditemukan
            </div>
          )}
        </div>
      </div>
    </KeyboardShortcutWrapper>
  );
}
