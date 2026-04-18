import { useState, useEffect } from 'react';
import { X, MessageCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <MessageCircle size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Kirim Invoice via WhatsApp
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={sending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Invoice Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase">
              Informasi Invoice
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Invoice:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {invoice.invoice_number}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {customer.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {formatRupiah(invoice.total_amount)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Jatuh Tempo:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Number Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
            <p className="text-xs text-gray-500 mt-1">
              Nomor akan otomatis diformat ke format internasional (+62)
            </p>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <p className="text-xs text-gray-500">
                Anda dapat mengedit pesan template di atas
              </p>
              <p className="text-xs text-gray-500">
                {message.length} karakter
              </p>
            </div>
          </div>

          {/* Send Status */}
          {sendStatus !== 'idle' && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              sendStatus === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
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
        <div className="flex gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-lg">
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
                <MessageCircle size={18} />
                Kirim Sekarang
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={sending}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
