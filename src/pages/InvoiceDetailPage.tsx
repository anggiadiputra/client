import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Download, Share2, Copy, Check, Mail } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import SendWhatsAppModal from '../components/SendWhatsAppModal';
import { servicesAPI, invoicesAPI, customersAPI, settingsAPI, bankAccountsAPI, emailsAPI } from '../lib/api';
import html2pdf from 'html2pdf.js';
import { toast } from '../components/Toast';
import { formatAddress } from '../lib/formatter';
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
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const hPadding = window.innerWidth < 640 ? 32 : 64;
      const availableWidth = window.innerWidth - hPadding;
      if (window.innerWidth < 800 + hPadding) {
        setScale(availableWidth / 800);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState({
    email: false,
    whatsapp: false,
    edit: false
  });

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const invoiceData = await invoicesAPI.getById(id);
      
      const [servicesData, settingsData, bankData] = await Promise.all([
        servicesAPI.getAll().catch(() => []),
        settingsAPI.get().catch(() => null),
        bankAccountsAPI.getAll().catch(() => []),
      ]);
      
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

  useEffect(() => {
    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const numberToWords = (n: number): string => {
    if (n === 0) return "Nol";
    const read = (num: number): string => {
      if (num < 12) return ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"][num];
      if (num < 20) return read(num - 10) + " Belas";
      if (num < 100) return (Math.floor(num / 10) === 1 ? "Sepuluh" : read(Math.floor(num / 10)) + " Puluh") + (num % 10 ? " " + read(num % 10) : "");
      if (num < 200) return "Seratus" + (num % 100 ? " " + read(num % 100) : "");
      if (num < 1000) return read(Math.floor(num / 100)) + " Ratus" + (num % 100 ? " " + read(num % 100) : "");
      if (num < 2000) return "Seribu" + (num % 1000 ? " " + read(num % 1000) : "");
      if (num < 1000000) return read(Math.floor(num / 1000)) + " Ribu" + (num % 1000 ? " " + read(num % 1000) : "");
      if (num < 1000000000) return read(Math.floor(num / 1000000)) + " Juta" + (num % 1000000 ? " " + read(num % 1000000) : "");
      if (num < 1000000000000) return read(Math.floor(num / 1000000000)) + " Miliar" + (num % 1000000000 ? " " + read(num % 1000000000) : "");
      return read(Math.floor(num / 1000000000000)) + " Triliun" + (num % 1000000000000 ? " " + read(num % 1000000000000) : "");
    };
    return read(n).trim();
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
          const clonedElement = clonedDoc.getElementById('invoice-content');
          if (clonedElement) {
            clonedElement.style.width = '1024px';
            const cards = clonedElement.querySelectorAll('.mobile-item-card');
            cards.forEach(c => (c as HTMLElement).style.display = 'none');
            const table = clonedElement.querySelector('.desktop-item-table');
            if (table) (table as HTMLElement).style.display = 'table';
          }

          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = clonedDoc.defaultView?.getComputedStyle(el);
            if (style) {
              for (let j = 0; j < style.length; j++) {
                const prop = style[j];
                const val = style.getPropertyValue(prop);
                
                if (val && (val.includes('oklch') || val.includes('var('))) {
                  if (prop.includes('shadow')) {
                    el.style.setProperty(prop, 'none', 'important');
                  } else if (prop.includes('color') || prop === 'fill' || prop === 'stroke') {
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
      const containers = document.querySelectorAll('.html2canvas-container');
      containers.forEach(container => container.remove());
      const iframes = document.querySelectorAll('iframe[id^="html2canvas"]');
      iframes.forEach(iframe => iframe.remove());
    };
 
    setIsDownloading(true);
    try {
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

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
  };

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/billing')}
        className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all mb-8"
      >
        <div className="p-1.5 rounded-lg group-hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </div>
        <span className="text-sm font-medium">Kembali ke Daftar</span>
      </button>

      <div className="max-w-5xl mx-auto overflow-hidden">
        <div 
          className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          style={{ 
            transform: scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top left',
            width: scale < 1 ? '800px' : 'auto',
          }}
        >
          <div 
            ref={invoiceRef} 
            id="invoice-content" 
            className="p-8 md:p-12 relative bg-white"
          >
          <div className="flex justify-between items-start gap-8 mb-12">
            {companySettings?.company_logo && !invoice.is_system ? (
              <div className="flex-shrink-0">
                <img 
                  src={companySettings.company_logo} 
                  alt="Logo" 
                  className="max-h-24 max-w-[240px] object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="text-3xl font-black text-blue-600 tracking-tighter uppercase">
                {invoice.is_system ? 'Kwitansi' : (companySettings?.company_name || 'INVOICE')}
              </div>
            )}
            <div className="text-right">
              <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter mb-6">
                {invoice.is_system 
                  ? (invoice.system_type === 'refund' ? 'Refund' : 'Receipt')
                  : 'Invoice'
                }
              </h1>
              <div className="inline-block text-left space-y-2 text-gray-700" style={{ fontSize: '14px' }}>
                <div className="flex border-b border-gray-100 pb-1.5">
                  <span className="w-28 font-medium text-gray-500 uppercase tracking-wider text-[10px]">No. Ref</span>
                  <span className="font-bold text-gray-900">: {invoice.invoice_number}</span>
                </div>
                <div className="flex border-b border-gray-100 pb-1.5">
                  <span className="w-28 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Tanggal</span>
                  <span className="font-bold text-gray-900">: {formatDate(invoice.issue_date)}</span>
                </div>
                {!invoice.is_system && (
                  <div className="flex border-b border-gray-100 pb-1.5">
                    <span className="w-28 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Jatuh Tempo</span>
                    <span className="font-bold text-gray-900">: {formatDate(invoice.due_date)}</span>
                  </div>
                )}
                {invoice.status === 'paid' && (
                  <div className="flex">
                    <span className="w-28 font-medium text-gray-500 uppercase tracking-wider text-[10px]">Status</span>
                    <span className="font-black text-emerald-600">: LUNAS</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-300 uppercase tracking-wider text-[11px]">
                Diterbitkan Oleh
              </h3>
              <div className="text-sm text-gray-700 space-y-1.5">
                <p className="font-bold text-gray-900 text-base">
                  {invoice.is_system ? 'Sistem Billing' : (companySettings?.company_name || '-')}
                </p>
                <p className="leading-relaxed max-w-xs text-gray-600">
                  {invoice.is_system ? 'Platform Management' : formatAddress({
                    street: companySettings?.company_address,
                    village: companySettings?.village_name,
                    district: companySettings?.district_name,
                    regency: companySettings?.regency_name,
                    province: companySettings?.province_name,
                    postalCode: companySettings?.company_postal_code,
                  })}
                </p>
                {!invoice.is_system && companySettings?.company_phone && <p className="text-gray-600">Ph: {companySettings.company_phone}</p>}
                {!invoice.is_system && companySettings?.company_email && <p className="text-gray-600">Email: {companySettings.company_email}</p>}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-300 uppercase tracking-wider text-[11px]">
                Ditujukan Kepada
              </h3>
              <div className="text-sm text-gray-700 space-y-1.5">
                <p className="font-bold text-gray-900 text-base">
                  {invoice.is_system 
                    ? (companySettings?.company_name || 'User') 
                    : (invoice.customer?.name || invoice.customer_name || '-')
                  }
                </p>
                {invoice.is_system ? (
                   <p className="leading-relaxed max-w-xs text-gray-600">{formatAddress({
                     street: companySettings?.company_address,
                     village: companySettings?.village_name,
                     district: companySettings?.district_name,
                     regency: companySettings?.regency_name,
                     province: companySettings?.province_name,
                     postalCode: companySettings?.company_postal_code,
                   })}</p>
                ) : (
                  <p className="leading-relaxed max-w-xs text-gray-600">{formatAddress(invoice.customer)}</p>
                )}
                <p className="text-gray-600">Ph: {invoice.is_system ? companySettings?.company_phone : (invoice.customer?.phone || '-')}</p>
                <p className="text-gray-600">Email: {invoice.is_system ? companySettings?.company_email : (invoice.customer?.email || '-')}</p>
              </div>
            </div>
          </div>

          <div className="mb-10 overflow-hidden rounded-lg border border-gray-200 desktop-item-table">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase tracking-tighter text-[11px]">
                  <th className="px-4 py-3 text-left first:rounded-tl-lg">Layanan / Produk</th>
                  <th className="px-4 py-3 text-left">Deskripsi</th>
                  <th className="px-4 py-3 text-center w-20">Jumlah</th>
                  <th className="px-4 py-3 text-right w-32">Harga</th>
                  {showDiscount && <th className="px-4 py-3 text-right w-24">Disc</th>}
                  <th className="px-5 py-4 text-right last:rounded-tr-lg w-36">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items?.map((item: any, index: number) => {
                  const isSystem = invoice.is_system;
                  const qty = isSystem ? 1 : (parseFloat(item.quantity) || 0);
                  const price = isSystem ? (parseFloat(item.amount) || 0) : (parseFloat(item.unit_price) || 0);
                  const discountPercent = isSystem ? 0 : (parseFloat(item.discount) || 0);
                  const itemTotal = (qty * price) * (1 - (showDiscount ? discountPercent / 100 : 0));

                  let productName = '-';
                  if (isSystem) {
                    productName = (invoice.system_type || 'System').toUpperCase();
                  } else {
                    const service = services.find((s: any) => s.id === item.service_id);
                    productName = service ? service.name : '-';
                  }

                  return (
                    <tr key={index} className="align-top hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {productName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm whitespace-pre-line leading-relaxed break-words min-w-[200px]">
                        {item.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{qty}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-gray-600">{formatCurrency(price)}</td>
                      {showDiscount && (
                        <td className="px-4 py-3 text-right whitespace-nowrap text-gray-500">
                          {discountPercent > 0 ? `${discountPercent}%` : '-'}
                        </td>
                      )}
                      <td className="px-5 py-5 text-right whitespace-nowrap font-bold text-gray-900">
                        {formatCurrency(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between gap-12 mb-8">
            <div className="flex-1">
              <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-6 relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Terbilang</h4>
                  <p className="text-sm italic text-gray-800 font-bold leading-relaxed">
                    {capitalizeWords(numberToWords(Math.round(grandTotal)))} Rupiah
                  </p>
                </div>
                {invoice.status === 'paid' && (
                  <div className="relative z-10 bg-green-100 text-green-700 px-6 py-2.5 rounded-xl font-black text-2xl border-2 border-green-200 rotate-[-3deg] shadow-sm whitespace-nowrap">
                    PAID / LUNAS
                  </div>
                )}
              </div>

              {invoice.status !== 'paid' && bankAccounts.length > 0 && (
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-blue-400 mb-3">Instruksi Pembayaran</h4>
                  <div className="text-sm space-y-2 text-gray-700">
                    {bankAccounts.map((acc, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-black text-blue-600">{acc.bank_name}</span>
                        <span className="font-mono font-bold">{acc.account_number}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-blue-100 mt-2">
                      <p className="text-xs text-blue-600 font-medium">A/N: <span className="font-bold">{bankAccounts[0].account_name}</span></p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-80">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm px-2">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Subtotal</span>
                  <span className="text-gray-900 font-bold">{formatCurrency(subtotal)}</span>
                </div>
                {showTax && totalTax > 0 && (
                  <div className="flex justify-between items-center text-sm px-2">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Pajak (PPN)</span>
                    <span className="text-gray-900 font-bold">+ {formatCurrency(totalTax)}</span>
                  </div>
                )}
                <div className="pt-4 mt-2 border-t-4 border-gray-900 flex justify-between items-center px-2">
                  <span className="text-base font-black text-gray-900 uppercase tracking-tighter">Total Akhir</span>
                  <span className="text-2xl font-black text-blue-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-medium italic">
              Terima kasih atas kepercayaan Anda menggunakan layanan kami.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-6 flex justify-end items-center">
          <div className="flex items-center gap-3 w-auto">
            <div className="flex gap-2 w-auto">
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
                className="flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-xl border border-gray-200 transition-all text-sm shadow-sm disabled:opacity-50"
                title="Share Link"
              >
                <Share2 size={16} /> <span>Bagikan</span>
              </button>
            </div>

            <div className="w-px h-8 bg-gray-200 mx-1"></div>

            <div className="flex gap-2 w-auto">
              <button
                onClick={handleSendEmail}
                disabled={isDownloading || isActionLoading.email}
                className={`flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm shadow-md shadow-blue-200 disabled:opacity-50 ${(isDownloading || isActionLoading.email) ? 'cursor-wait' : ''}`}
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
                className="flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm shadow-md shadow-green-200 disabled:opacity-50"
              >
                <WhatsAppIcon size={16} className="fill-current" /> WhatsApp
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

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
