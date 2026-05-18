import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);
import { whatsappAPI } from '../lib/api';
import { generateInvoiceTemplate, formatRupiah } from '../lib/templates';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  tax_amount?: number;
  paid_amount?: number;
  issue_date: string;
  due_date: string;
  status: string;
  notes?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

interface Customer {
  name: string;
  phone?: string;
}

interface CompanySettings {
  company_name?: string;
  company_phone?: string;
  company_email?: string;
  wa_invoice_template?: string;
  wa_paid_template?: string;
  wa_reminder_template?: string;
}

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  customer: Customer;
  companySettings?: CompanySettings;
  onSuccess: () => void;
}

export default function SendWhatsAppModal({
  isOpen,
  onClose,
  invoice,
  customer,
  companySettings,
  onSuccess,
}: SendWhatsAppModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(customer.phone || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleClose = () => {
    if (!sending) {
      onClose();
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: handleClose,
    enabled: isOpen && !sending,
  });

  useEffect(() => {
    if (isOpen) {
      // Generate default message when modal opens
      const template = generateInvoiceTemplate(invoice, customer, companySettings || {});
      setMessage(template);
      setPhoneNumber(customer.phone || '');
      setSendStatus('idle');
      setStatusMessage('');
    }
  }, [isOpen, invoice, customer, companySettings]);

  const handleSend = async () => {
    if (!phoneNumber) {
      setStatusMessage('Nomor telepon harus diisi');
      setSendStatus('error');
      return;
    }

    if (!message) {
      setStatusMessage('Pesan tidak boleh kosong');
      setSendStatus('error');
      return;
    }

    setSending(true);
    setSendStatus('idle');

    try {
      // Normalize phone number
      let normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '62' + normalizedPhone.substring(1);
      }

      await whatsappAPI.sendInvoice({
        invoiceId: invoice.id,
        customerPhone: normalizedPhone,
        customMessage: message,
        countryCode: '62',
      });

      setSendStatus('success');
      setStatusMessage('Pesan berhasil dikirim via WhatsApp!');
      
      // Close modal after 1.5 seconds on success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      setSendStatus('error');
      setStatusMessage(error.message || 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-separator sticky top-0 bg-surface rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/100 p-2 rounded-lg">
              <WhatsAppIcon size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-tx-main">
              Kirim Invoice via WhatsApp
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={sending}
            className="text-tx-subtle hover:text-tx-muted transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Invoice Info */}
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-bold text-tx-main uppercase">
              Informasi Invoice
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-tx-muted">Invoice:</span>
                <span className="ml-2 font-semibold text-tx-main">
                  {invoice.invoice_number}
                </span>
              </div>
              <div>
                <span className="text-tx-muted">Customer:</span>
                <span className="ml-2 font-semibold text-tx-main">
                  {customer.name}
                </span>
              </div>
              <div>
                <span className="text-tx-muted">Total:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {formatRupiah(invoice.total_amount)}
                </span>
              </div>
              <div>
                <span className="text-tx-muted">Jatuh Tempo:</span>
                <span className="ml-2 font-semibold text-tx-main">
                  {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-tx-muted">Status:</span>
                <span className="ml-2 font-semibold text-tx-main">
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Number Input */}
          <div>
            <label className="block text-sm font-semibold text-tx-muted mb-2">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="08xxxxxxxxxx"
              disabled={sending}
            />
            <p className="text-xs text-tx-muted mt-1">
              Nomor akan otomatis diformat ke format internasional (+62)
            </p>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-semibold text-tx-muted mb-2">
              Pesan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
              rows={12}
              placeholder="Ketik pesan Anda di sini..."
              disabled={sending}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-tx-muted">
                Anda dapat mengedit pesan template di atas
              </p>
              <p className="text-xs text-tx-muted">
                {message.length} karakter
              </p>
            </div>
          </div>

          {/* Send Status */}
          {sendStatus !== 'idle' && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              sendStatus === 'success'
                ? 'bg-green-500/10 text-green-700 border border-green-200'
                : 'bg-red-500/10 text-red-700 border border-red-200'
            }`}>
              {sendStatus === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="text-sm font-medium">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-separator sticky bottom-0 bg-surface rounded-b-lg">
          <button
            onClick={handleSend}
            disabled={sending || !phoneNumber || !message}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {sending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <WhatsAppIcon size={18} />
                Kirim Sekarang
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={sending}
            className="px-6 py-3 border border-gray-300 text-tx-muted font-semibold rounded-lg hover:bg-surface-2 disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
