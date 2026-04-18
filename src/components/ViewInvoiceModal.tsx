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
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.draft;
  };

  // Determine display preferences - for old invoices, auto-detect from items
  const showDiscount = invoice?.show_discount ?? invoice?.items?.some((item: any) => item.discount > 0) ?? false;
  const showTax = invoice?.show_tax ?? invoice?.items?.some((item: any) => item.tax_rate > 0) ?? false;

  if (!isOpen) return null;

  return (
    <KeyboardShortcutWrapper onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detail Invoice</h2>
            {invoice && <p className="text-sm text-gray-600 mt-1">{invoice.invoice_number}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Printer size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Informasi Invoice</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>{invoice.status}</span></p>
                    <p><span className="text-gray-600">Tanggal Issue:</span> {new Date(invoice.issue_date).toLocaleDateString('id-ID')}</p>
                    <p><span className="text-gray-600">Jatuh Tempo:</span> {new Date(invoice.due_date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{invoice.customer_name}</p>
                    <p className="text-gray-600">{invoice.customer_email}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Item Layanan</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Deskripsi</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">Qty</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">Harga</th>
                        {showDiscount && <th className="text-right px-4 py-3 font-semibold text-gray-700">Diskon</th>}
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
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
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  {showTax && invoice.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pajak:</span>
                      <span>{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(invoice.total_amount + (showTax ? invoice.tax_amount : 0))}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Catatan</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">{invoice.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Invoice tidak ditemukan
            </div>
          )}
        </div>
      </div>
    </KeyboardShortcutWrapper>
  );
}
