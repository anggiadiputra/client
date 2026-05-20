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
import ClassicTemplate from '../components/invoice-templates/ClassicTemplate';
import ModernTemplate from '../components/invoice-templates/ModernTemplate';
import { Layout } from 'lucide-react';

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
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern'>('classic');

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
      
      if (invoiceData.template_id) {
        setSelectedTemplate(invoiceData.template_id);
      }

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
      <div className="p-8 bg-surface-2 min-h-[60vh]">
        <div className="text-center py-12 text-tx-muted">Invoice tidak ditemukan</div>
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
        onClick={() => navigate('/invoices')}
        className="group flex items-center gap-2 text-tx-muted hover:text-tx-main transition-all mb-8"
      >
        <div className="p-1.5 rounded-lg group-hover:bg-surface-2 transition-colors">
          <ArrowLeft size={18} />
        </div>
        <span className="text-sm font-medium">Kembali ke Daftar</span>
      </button>

      <div className="max-w-5xl mx-auto overflow-hidden">
        <div 
          className="transition-all duration-500 ease-in-out"
          style={{ 
            transform: scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top left',
            width: scale < 1 ? '800px' : 'auto',
          }}
        >
          {selectedTemplate === 'classic' ? (
            <ClassicTemplate 
              invoice={invoice}
              companySettings={companySettings}
              bankAccounts={bankAccounts}
              services={services}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              numberToWords={numberToWords}
              capitalizeWords={capitalizeWords}
              showDiscount={showDiscount}
              showTax={showTax}
              subtotal={subtotal}
              totalTax={totalTax}
              grandTotal={grandTotal}
              invoiceRef={invoiceRef}
            />
          ) : (
            <ModernTemplate 
              invoice={invoice}
              companySettings={companySettings}
              bankAccounts={bankAccounts}
              services={services}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              numberToWords={numberToWords}
              capitalizeWords={capitalizeWords}
              showDiscount={showDiscount}
              showTax={showTax}
              subtotal={subtotal}
              totalTax={totalTax}
              grandTotal={grandTotal}
              invoiceRef={invoiceRef}
            />
          )}
        </div>

        <div className="bg-surface-2 border-t border-separator p-6 flex justify-end items-center">
          <div className="flex items-center gap-3 w-auto">
            <div className="flex gap-2 w-auto">
              {!invoice.is_system && (
              <button
                onClick={() => navigate(`/invoices/${invoice.invoice_number}/edit`)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface hover:bg-surface-2 text-tx-muted font-bold py-2.5 px-4 rounded-xl border border-separator transition-all text-sm shadow-sm"
                title="Edit Invoice"
              >
                <Edit size={16} /> <span>Edit</span>
              </button>
            )}
              
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface hover:bg-surface-2 text-tx-muted font-bold py-2.5 px-4 rounded-xl border border-separator transition-all text-sm shadow-sm ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
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
                className="flex-none flex items-center justify-center gap-2 bg-surface hover:bg-surface-2 text-tx-muted font-bold py-2.5 px-4 rounded-xl border border-separator transition-all text-sm shadow-sm disabled:opacity-50"
                title="Share Link"
              >
                <Share2 size={16} /> <span>Bagikan</span>
              </button>

              <button
                onClick={() => setSelectedTemplate(selectedTemplate === 'classic' ? 'modern' : 'classic')}
                className="flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm shadow-sm"
                title="Ganti Desain"
              >
                <Layout size={16} /> <span>Desain</span>
              </button>
            </div>

            <div className="w-px h-8 bg-surface-2 mx-1"></div>

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
                className="flex-none flex items-center justify-center gap-2 bg-green-500/100 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm shadow-md shadow-green-200 disabled:opacity-50"
              >
                <WhatsAppIcon size={16} className="fill-current" /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {showShareLink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-xl font-black text-tx-main mb-2">Bagikan Link Invoice</h3>
            <p className="text-sm text-tx-muted mb-6 leading-relaxed">
              Salin link publik berikut untuk dikirimkan kepada customer. Link ini berlaku hingga masa kedaluwarsa invoice.
            </p>
            
            <div className="bg-surface-2 border border-separator rounded-xl p-4 mb-6 group relative">
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
                className="flex-1 bg-surface-2 hover:bg-surface-2 text-tx-muted font-bold py-3 px-4 rounded-xl transition-colors text-sm"
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
