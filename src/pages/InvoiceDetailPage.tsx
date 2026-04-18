import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Download, Share2, Copy, Check, Mail } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import SendWhatsAppModal from '../components/SendWhatsAppModal';
import { servicesAPI, invoicesAPI, customersAPI, settingsAPI, bankAccountsAPI } from '../lib/api';
import html2pdf from 'html2pdf.js';
import { toast } from '../components/Toast';
import { toTitleCase } from '../lib/formatter';

export default function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareLink, setShowShareLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch invoice with customer details using centralized API
      const invoiceData = await invoicesAPI.getById(id);
      
      // 2. Fetch dependencies in parallel using centralized API
      const [servicesData, settingsData, bankData] = await Promise.all([
        servicesAPI.getAll().catch(() => []),
        settingsAPI.get().catch(() => null),
        bankAccountsAPI.getAll().catch(() => []),
      ]);
      
      // Fetch customer details if they're not fully embedded
      if (invoiceData.customer_id && !invoiceData.customer) {
        try {
          const customers = await customersAPI.getAll();
          const customerList = Array.isArray(customers) ? customers : (customers.data || []);
          const customer = customerList.find((c: any) => c.id === invoiceData.customer_id);
          if (customer) invoiceData.customer = customer;
        } catch (e) {
          console.warn('Could not fetch customer details', e);
        }
      }
      
      setInvoice(invoiceData);
      setCompanySettings(settingsData);
      setBankAccounts(bankData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
    const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 
                   'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
    const tens = ['', 'Sepuluh', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 
                   'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

    if (num === 0) return 'Nol';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Ratus' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 ? ' ' + numberToWords(num % 1000000) : '');
    if (num < 1000000000000) return numberToWords(Math.floor(num / 1000000000)) + ' Miliar' + (num % 1000000000 ? ' ' + numberToWords(num % 1000000000) : '');
    return numberToWords(Math.floor(num / 1000000000000)) + ' Triliun' + (num % 1000000000000 ? ' ' + numberToWords(num % 1000000000000) : '');
  };

  const handleWhatsApp = () => {
    if (!invoice?.customer?.phone && !invoice?.customer_phone) {
      toast.error('Nomor WhatsApp customer tidak tersedia');
      return;
    }
    setShowWhatsAppModal(true);
  };

  const handleSendEmail = async () => {
    try {
      if (!id) return;
      await emailsAPI.sendInvoice(parseInt(id));
      toast.success('Email berhasil dikirim!');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Terjadi kesalahan saat mengirim email');
    }
  };

  const handleShareLink = () => {
    setShowShareLink(true);
    setCopied(false);
  };

  const handleCopyLink = async () => {
    const publicUrl = `${window.location.origin}/public/invoice/${invoice.invoice_number}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = publicUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    const element = invoiceRef.current;
    
    const opt = {
      margin: 0,
      filename: `${invoice.invoice_number}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const,
      },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal mengunduh PDF');
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-[60vh] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 bg-gray-50 min-h-[60vh]">
        <div className="text-center py-12 text-gray-500">Invoice tidak ditemukan</div>
      </div>
    );
  }

  const showDiscount = invoice.show_discount === true;
  const showTax = invoice.show_tax === true;

  const subtotal = invoice.items?.reduce((sum: number, item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const discountPercent = parseFloat(item.discount) || 0;
    const lineTotal = qty * price;
    const discountAmount = showDiscount ? lineTotal * (discountPercent / 100) : 0;
    return sum + (lineTotal - discountAmount);
  }, 0) || 0;

  const totalTax = invoice.items?.reduce((sum: number, item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const discountPercent = parseFloat(item.discount) || 0;
    const taxPercent = parseFloat(item.tax_rate) || 0;
    const lineTotal = qty * price;
    const discountAmount = showDiscount ? lineTotal * (discountPercent / 100) : 0;
    const itemSubtotal = lineTotal - discountAmount;
    const taxAmount = showTax ? itemSubtotal * (taxPercent / 100) : 0;
    return sum + taxAmount;
  }, 0) || 0;

  const grandTotal = subtotal + totalTax;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/invoices')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">Kembali ke Daftar</span>
      </button>

      {/* Invoice Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Invoice Content - Ref for PDF */}
        <div ref={invoiceRef} className="p-6 md:p-10 relative">
          {/* Paid Stamp */}
          {invoice.status === 'paid' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
              <div className="-rotate-[20deg] border-[4px] border-emerald-500/10 text-emerald-500/10 text-7xl font-black px-12 py-4 rounded-xl uppercase tracking-[8px] whitespace-nowrap">
                LUNAS
              </div>
            </div>
          )}
          
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
            {companySettings?.company_logo ? (
              <div className="flex-shrink-0">
                <img 
                  src={companySettings.company_logo} 
                  alt="Logo" 
                  className="max-h-20 max-w-[200px] object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                {companySettings?.company_name?.[0] || 'I'}
              </div>
            )}
            <div className="text-left md:text-right">
              <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">INVOICE</h1>
              <div className="space-y-1.5 text-sm">
                <p className="text-gray-500">No. Tagihan: <span className="font-bold text-gray-900">{invoice.invoice_number}</span></p>
                <p className="text-gray-500">Tanggal: <span className="font-semibold text-gray-900">{formatDate(invoice.issue_date)}</span></p>
                <p className="text-gray-500">Jatuh Tempo: <span className="font-semibold text-gray-900">{formatDate(invoice.due_date)}</span></p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Diterbitkan Oleh</p>
              <div className="text-sm space-y-1.5">
                <p className="font-bold text-gray-900 text-base">{companySettings?.company_name || '-'}</p>
                <p className="text-gray-600 leading-relaxed max-w-xs">{toTitleCase(companySettings?.company_address || '-')}</p>
                {companySettings?.company_phone && <p className="text-gray-600">Telp: {companySettings.company_phone}</p>}
                {companySettings?.company_email && <p className="text-gray-600">Email: {companySettings.company_email}</p>}
              </div>
            </div>
            <div className="md:text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Ditujukan Kepada</p>
              <div className="text-sm space-y-1.5">
                <p className="font-bold text-gray-900 text-base">{invoice.customer?.name || invoice.customer_name || '-'}</p>
                {invoice.customer?.address && <p className="text-gray-600 leading-relaxed max-w-xs">{toTitleCase(invoice.customer.address)}</p>}
                {(invoice.customer?.city || invoice.customer?.province_name) && (
                  <p className="text-gray-600">{toTitleCase([invoice.customer?.city, invoice.customer?.province_name].filter(Boolean).join(', '))}</p>
                )}
                {invoice.customer?.phone && <p className="text-gray-600">Telp: {invoice.customer.phone}</p>}
                {invoice.customer?.email && <p className="text-gray-600">Email: {invoice.customer.email}</p>}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mb-10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="py-3 text-left font-bold text-gray-900">Deskripsi Layanan</th>
                  <th className="py-3 text-center font-bold text-gray-900 px-4">Qty</th>
                  <th className="py-3 text-right font-bold text-gray-900">Harga Unit</th>
                  {showDiscount && <th className="py-3 text-right font-bold text-gray-900 px-4">Diskon</th>}
                  <th className="py-3 text-right font-bold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items?.map((item: any, index: number) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.unit_price) || 0;
                  const discountPercent = parseFloat(item.discount) || 0;
                  const itemTotal = (qty * price) * (1 - (showDiscount ? discountPercent / 100 : 0));
                  const service = services.find((s: any) => s.id === item.service_id);

                  return (
                    <tr key={index}>
                      <td className="py-4">
                        <p className="font-bold text-gray-900">{service?.name || 'Layanan'}</p>
                        <p className="text-gray-500 text-xs mt-1 whitespace-pre-line leading-relaxed">{item.description || '-'}</p>
                      </td>
                      <td className="py-4 text-center px-4 text-gray-600">{qty}</td>
                      <td className="py-4 text-right text-gray-600">Rp {new Intl.NumberFormat('id-ID').format(price)}</td>
                      {showDiscount && <td className="py-4 text-right px-4 text-gray-500">{discountPercent > 0 ? `${discountPercent}%` : '-'}</td>}
                      <td className="py-4 text-right font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Metode Pembayaran</p>
                <div className="text-sm space-y-1">
                  {bankAccounts.length > 0 ? (
                    <>
                      {bankAccounts.map((acc, i) => (
                        <p key={i} className="font-semibold text-gray-800">{acc.bank_name} - {acc.account_number}</p>
                      ))}
                      <p className="text-gray-500 text-xs">A/N: {bankAccounts[0].account_name}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">Hubungi kami untuk detail pembayaran.</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Terbilang</p>
                  <p className="text-xs font-medium italic text-gray-600 leading-relaxed">{numberToWords(Math.round(grandTotal))} Rupiah</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-72">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-gray-900 font-semibold">Rp {new Intl.NumberFormat('id-ID').format(subtotal)}</span>
                </div>
                {showTax && totalTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Pajak (PPN)</span>
                    <span className="text-gray-900 font-semibold">+ Rp {new Intl.NumberFormat('id-ID').format(totalTax)}</span>
                  </div>
                )}
                <div className="pt-3 border-t-2 border-gray-900 flex justify-between">
                  <span className="text-base font-black text-gray-900 uppercase">Total Akhir</span>
                  <span className="text-lg font-black text-blue-600">Rp {new Intl.NumberFormat('id-ID').format(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/invoices/${id}/edit`)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-6 rounded-lg border border-gray-200 transition-all text-sm shadow-sm"
          >
            <Edit size={16} /> Edit
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-6 rounded-lg border border-gray-200 transition-all text-sm shadow-sm"
          >
            <Download size={16} /> Unduh PDF
          </button>

          <button
            onClick={handleShareLink}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-6 rounded-lg border border-gray-200 transition-all text-sm shadow-sm"
          >
            <Share2 size={16} /> Bagikan
          </button>

          <div className="w-full sm:w-px sm:h-8 bg-gray-200 mx-1 hidden sm:block"></div>

          <button
            onClick={handleSendEmail}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all text-sm shadow-md shadow-blue-200"
          >
            <Mail size={16} /> Kirim Email
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all text-sm shadow-md shadow-green-200"
          >
            <WhatsAppIcon size={16} className="fill-current" /> WhatsApp
          </button>
        </div>
      </div>

      {/* Modals */}
      {showShareLink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-xl font-black text-gray-900 mb-2">Bagikan Link Invoice</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Salin link publik berikut untuk dikirimkan kepada customer. Link ini berlaku hingga masa kedaluwarsa invoice.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 group relative">
              <code className="text-xs text-blue-600 font-mono break-all line-clamp-2">
                {window.location.origin}/public/invoice/{invoice.invoice_number}
              </code>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Tersalin!' : 'Salin Link'}
              </button>
              <button
                onClick={() => setShowShareLink(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhatsAppModal && (
        <SendWhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          invoice={invoice}
          customer={{
            name: invoice.customer?.name || invoice.customer_name || 'Customer',
            phone: invoice.customer?.phone || invoice.customer_phone || '',
          }}
          companySettings={companySettings ? {
            company_name: companySettings.company_name,
            company_phone: companySettings.company_phone,
            company_email: companySettings.company_email,
            wa_invoice_template: companySettings.wa_invoice_template,
          } : undefined}
          onSuccess={() => {
            setShowWhatsAppModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
