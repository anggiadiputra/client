import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Download, Share2, Copy, Check, Mail } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import SendWhatsAppModal from '../components/SendWhatsAppModal';
import { servicesAPI, invoicesAPI, customersAPI, settingsAPI, bankAccountsAPI, emailsAPI } from '../lib/api';
import html2pdf from 'html2pdf.js';
import { toast } from '../components/Toast';
import { toTitleCase, formatAddress } from '../lib/formatter';
import { SkeletonBlock, SkeletonTable } from '../components/LoadingSkeleton';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState({
    email: false,
    whatsapp: false,
    edit: false
  });

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

      // If the current URL has a numeric ID, replace it with the invoice number for SEO-friendly URLs
      if (id && !isNaN(Number(id)) && invoiceData.invoice_number) {
        navigate(`/invoices/${invoiceData.invoice_number}/view`, { replace: true });
      }
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
      if (!invoice?.id) {
        toast.error('Data invoice belum dimuat sepenuhnya');
        return;
      }
      setIsActionLoading(prev => ({ ...prev, email: true }));
      await emailsAPI.sendInvoice(invoice.id);
      toast.success('Email berhasil dikirim!');
    } catch (error: any) {
      console.error('Error sending email:', error);
      
      // More helpful error message for SMTP issues
      if (error.message?.includes('SMTP settings not configured')) {
        toast.error('SMTP belum dikonfigurasi. Silakan hubungi Admin atau atur di Menu Pengaturan.');
      } else {
        toast.error(error.message || 'Terjadi kesalahan saat mengirim email');
      }
    } finally {
      setIsActionLoading(prev => ({ ...prev, email: false }));
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
        onclone: (clonedDoc: Document) => {
          // Exhaustive fix for oklch colors which crash html2canvas
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = clonedDoc.defaultView?.getComputedStyle(el);
            if (style) {
              // Instead of a whitelist, we now check ALL computed properties
              // This is more exhaustive and covers every possible color field
              for (let j = 0; j < style.length; j++) {
                const prop = style[j];
                const val = style.getPropertyValue(prop);
                
                if (val && (val.includes('oklch') || val.includes('var('))) {
                  // For shadows, removing them is the safest way to prevent a crash
                  if (prop.includes('shadow')) {
                    el.style.setProperty(prop, 'none', 'important');
                  } else if (prop.includes('color') || prop === 'fill' || prop === 'stroke') {
                    // For other colors, provide a safe fallback
                    el.style.setProperty(prop, 'currentColor', 'important');
                  }
                }
              }
            }
          }
        }
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const,
      },
    };
 
    const forceCleanup = () => {
      // Emergency cleanup for html2canvas containers that might block the UI
      const containers = document.querySelectorAll('.html2canvas-container');
      containers.forEach(container => container.remove());
      
      // Also check for any iframes left by the library
      const iframes = document.querySelectorAll('iframe[id^="html2canvas"]');
      iframes.forEach(iframe => iframe.remove());
    };
 
    setIsDownloading(true);
    try {
      // Add a safety timeout to prevent permanent UI lockup
      const pdfPromise = html2pdf().set(opt).from(element).save();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timed out')), 30000)
      );

      await Promise.race([pdfPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal mengunduh PDF. Silakan coba lagi.');
      forceCleanup();
    } finally {
      setIsDownloading(false);
      // Ensure cleanup runs even on success just in case
      setTimeout(forceCleanup, 1000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <SkeletonBlock width="120px" height="40px" rounded />
            <SkeletonBlock width="200px" height="24px" />
          </div>
          <SkeletonBlock width="150px" height="150px" rounded />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <SkeletonBlock width="100px" height="16px" />
            <SkeletonBlock width="100%" height="80px" rounded />
          </div>
          <div className="space-y-3">
            <SkeletonBlock width="100px" height="16px" />
            <SkeletonBlock width="100%" height="80px" rounded />
          </div>
        </div>
        <SkeletonTable rows={4} columns={4} />
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
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
            {companySettings?.company_logo && !invoice.is_system ? (
              <div className="flex-shrink-0">
                <img 
                  src={companySettings.company_logo} 
                  alt="Logo" 
                  className="max-h-20 max-w-[200px] object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="text-2xl font-black text-blue-600 tracking-tighter uppercase">
                {invoice.is_system ? 'Kwitansi Pembayaran' : (companySettings?.company_name || 'INVOICE')}
              </div>
            )}
            <div className="text-left md:text-right">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4 uppercase">
                {invoice.is_system 
                  ? (invoice.system_type === 'refund' ? 'Refund' : 'Receipt')
                  : 'Invoice'
                }
              </h1>
              <div className="space-y-2 text-sm">
                <div className="flex items-center md:justify-end gap-2 text-gray-500">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono text-[10px] uppercase">No. Ref</span>
                  <span className="font-bold text-gray-900">{invoice.invoice_number}</span>
                </div>
                <p className="text-gray-500">Tanggal: <span className="font-semibold text-gray-900">{formatDate(invoice.issue_date)}</span></p>
                {!invoice.is_system && (
                  <p className="text-gray-500">Jatuh Tempo: <span className="font-semibold text-gray-900">{formatDate(invoice.due_date)}</span></p>
                )}
                {invoice.status === 'paid' && (
                  <p className="text-gray-500">Status: <span className="font-bold text-emerald-600">PAID</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Diterbitkan Oleh</p>
              <div className="text-sm space-y-1.5">
                <p className="font-bold text-gray-900 text-base">
                  {invoice.is_system ? 'Sistem Billing' : (companySettings?.company_name || '-')}
                </p>
                <p className="text-gray-600 leading-relaxed max-w-xs">
                  {invoice.is_system ? 'Platform Management' : formatAddress({
                    street: companySettings?.company_address,
                    village: companySettings?.village_name,
                    district: companySettings?.district_name,
                    regency: companySettings?.regency_name,
                    province: companySettings?.province_name,
                    postalCode: companySettings?.company_postal_code,
                  })}
                </p>
                {!invoice.is_system && companySettings?.company_phone && <p className="text-gray-600">Telp: {companySettings.company_phone}</p>}
                {!invoice.is_system && companySettings?.company_email && <p className="text-gray-600">Email: {companySettings.company_email}</p>}
              </div>
            </div>
            <div className="md:text-left">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Ditujukan Kepada</p>
              <div className="text-sm space-y-1.5">
                <p className="font-bold text-gray-900 text-base">
                  {invoice.is_system 
                    ? (companySettings?.company_name || 'User') 
                    : (invoice.customer?.name || invoice.customer_name || '-')
                  }
                </p>
                {invoice.is_system ? (
                   <p className="text-gray-600 leading-relaxed max-w-xs">{formatAddress({
                     street: companySettings?.company_address,
                     village: companySettings?.village_name,
                     district: companySettings?.district_name,
                     regency: companySettings?.regency_name,
                     province: companySettings?.province_name,
                     postalCode: companySettings?.company_postal_code,
                   })}</p>
                ) : (
                  <>
                    <p className="text-gray-600 leading-relaxed max-w-xs">{formatAddress({
                      street: invoice.customer?.address,
                      village: invoice.customer?.village_name,
                      district: invoice.customer?.district_name,
                      regency: invoice.customer?.regency_name || invoice.customer?.city,
                      province: invoice.customer?.province_name,
                      postalCode: invoice.customer?.postal_code,
                    })}</p>
                  </>
                )}
                <p className="text-gray-600">Telp: {invoice.is_system ? companySettings?.company_phone : invoice.customer?.phone || '-'}</p>
                <p className="text-gray-600">Email: {invoice.is_system ? companySettings?.company_email : invoice.customer?.email || '-'}</p>
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
              {invoice.status !== 'paid' && (
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
              )}
              {invoice.status === 'paid' && (
                <div className="bg-green-50 rounded-lg p-5 border border-green-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-green-600 mb-2">Status Pembayaran</p>
                  <p className="text-sm font-bold text-green-800">LUNAS / PAID</p>
                  <p className="text-xs text-green-600 mt-1">Terima kasih atas pembayaran Anda.</p>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-green-400 mb-1">Terbilang</p>
                    <p className="text-xs font-medium italic text-green-600 leading-relaxed">{numberToWords(Math.round(grandTotal))} Rupiah</p>
                  </div>
                </div>
              )}
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
        <div className="bg-gray-50 border-t border-gray-100 p-6 flex justify-end items-center">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              {!invoice.is_system && (
              <button
                onClick={() => navigate(`/invoices/${invoice.invoice_number}/edit`)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-xl border border-gray-200 transition-all text-sm shadow-sm"
                title="Edit Invoice"
              >
                <Edit size={16} /> <span>Edit</span>
              </button>
            )}
              
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-xl border border-gray-200 transition-all text-sm shadow-sm ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
                title="Download PDF"
              >
                {isDownloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <Download size={16} />
                )}
                <span>{isDownloading ? 'Memproses...' : 'Unduh PDF'}</span>
              </button>

              <button
                onClick={handleShareLink}
                disabled={isDownloading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-xl border border-gray-200 transition-all text-sm shadow-sm disabled:opacity-50"
                title="Share Link"
              >
                <Share2 size={16} /> <span>Bagikan</span>
              </button>
            </div>

            <div className="w-full sm:w-px sm:h-8 bg-gray-200 mx-1 hidden sm:block"></div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleSendEmail}
                disabled={isDownloading || isActionLoading.email}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm shadow-md shadow-blue-200 disabled:opacity-50 ${(isDownloading || isActionLoading.email) ? 'cursor-wait' : ''}`}
              >
                {isActionLoading.email ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Mail size={16} />
                )}
                {isActionLoading.email ? 'Mengirim...' : 'Kirim Email'}
              </button>

              <button
                onClick={handleWhatsApp}
                disabled={isDownloading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm shadow-md shadow-green-200 disabled:opacity-50"
              >
                <WhatsAppIcon size={16} className="fill-current" /> WhatsApp
              </button>
            </div>
          </div>
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
