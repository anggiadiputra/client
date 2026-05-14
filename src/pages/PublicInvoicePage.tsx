import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { formatAddress } from '../lib/formatter';
import { publicAPI } from '../lib/api';
import { SkeletonBlock, SkeletonTable } from '../components/LoadingSkeleton';
import ClassicTemplate from '../components/invoice-templates/ClassicTemplate';
import ModernTemplate from '../components/invoice-templates/ModernTemplate';
import { Layout } from 'lucide-react';

export default function PublicInvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
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
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      // Fetch invoice using centralized public API (returns inlined bank accounts and services)
      const invoiceData = await publicAPI.getInvoice(id);
      setInvoice(invoiceData);
      
      // Use inlined data from invoiceData
      if (invoiceData.bank_accounts) setBankAccounts(invoiceData.bank_accounts);
      if (invoiceData.services) setServices(invoiceData.services);

      if (invoiceData.template_id) {
        setSelectedTemplate(invoiceData.template_id);
      }

      // If the current URL has a numeric ID, replace it with the invoice number for SEO-friendly URLs
      if (id && !isNaN(Number(id)) && invoiceData.invoice_number) {
        navigate(`/public/invoice/${invoiceData.invoice_number}`, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '-';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (l) => l.toUpperCase());
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
          // Force desktop width for PDF capture so it always uses the table layout
          const clonedElement = clonedDoc.getElementById('invoice-content');
          if (clonedElement) {
            clonedElement.style.width = '1024px';
            // Ensure any mobile-only cards are hidden and table is visible in PDF
            const cards = clonedElement.querySelectorAll('.mobile-item-card');
            cards.forEach(c => (c as HTMLElement).style.display = 'none');
            const table = clonedElement.querySelector('.desktop-item-table');
            if (table) (table as HTMLElement).style.display = 'table';
          }

          // Exhaustive fix for oklch colors which crash html2canvas
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = clonedDoc.defaultView?.getComputedStyle(el);
            if (style) {
              // Check ALL computed properties to ensure no oklch leaks through
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
      // Emergency cleanup for html2canvas containers that might block the UI
      const containers = document.querySelectorAll('.html2canvas-container');
      containers.forEach(container => container.remove());
      
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
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
      forceCleanup();
    } finally {
      setIsDownloading(false);
      // Ensure cleanup runs even on success just in case
      setTimeout(forceCleanup, 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-4 sm:p-8">
        <div className="max-w-4xl mx-auto w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-10">
              <SkeletonBlock width="150px" height="60px" />
              <div className="flex flex-col items-end space-y-2">
                <SkeletonBlock width="120px" height="32px" />
                <SkeletonBlock width="180px" height="20px" />
                <SkeletonBlock width="180px" height="20px" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <SkeletonBlock width="100px" height="16px" />
                <SkeletonBlock width="60%" height="80px" rounded />
              </div>
              <div className="space-y-2">
                <SkeletonBlock width="100px" height="16px" />
                <SkeletonBlock width="60%" height="80px" rounded />
              </div>
            </div>

            <SkeletonTable rows={3} columns={4} />

            <div className="mt-8 flex justify-end">
               <SkeletonBlock width="250px" height="100px" rounded />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isExpired = error.toLowerCase().includes('expired');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className={`${isExpired ? 'text-orange-500' : 'text-red-500'} mb-4`}>
            {isExpired ? (
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isExpired ? 'Invoice Link Expired' : 'Invoice Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {isExpired && (
            <p className="text-sm text-gray-500 mb-6">
              Public invoice links are only valid for 40 days from the date of creation.
              Please contact the administrator for the latest invoice.
            </p>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  // Determine display preferences
  const showDiscount = invoice.show_discount ?? invoice.items?.some((item: any) => item.discount > 0) ?? false;
  const showTax = invoice.show_tax ?? invoice.items?.some((item: any) => item.tax_rate > 0) ?? false;

  // Use values from database for consistency
  const subtotal = parseFloat(invoice.total_amount || 0);
  const totalTax = parseFloat(invoice.tax_amount || 0);
  const grandTotal = subtotal + totalTax;

  const isPublicRoute = window.location.pathname.startsWith('/public/');

  return (
    <div className={`min-h-screen ${isPublicRoute ? 'bg-gray-50' : 'bg-transparent p-0'}`}>
      {/* Back Button - Only show on public route */}
      {isPublicRoute && (
        <div className="p-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      )}

      {/* Invoice Card Container */}
      <div className="max-w-5xl mx-auto px-4 py-4 overflow-hidden">
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
              companySettings={{
                company_logo: invoice.sender?.logo,
                company_name: invoice.sender?.name,
                company_address: invoice.sender?.address,
                company_phone: invoice.sender?.phone,
                company_email: invoice.sender?.email,
                village_name: invoice.sender?.village_name,
                district_name: invoice.sender?.district_name,
                regency_name: invoice.sender?.regency_name,
                province_name: invoice.sender?.province_name,
                company_postal_code: invoice.sender?.postal_code,
              }}
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
              companySettings={{
                company_logo: invoice.sender?.logo,
                company_name: invoice.sender?.name,
                company_address: invoice.sender?.address,
                company_phone: invoice.sender?.phone,
                company_email: invoice.sender?.email,
                village_name: invoice.sender?.village_name,
                district_name: invoice.sender?.district_name,
                regency_name: invoice.sender?.regency_name,
                province_name: invoice.sender?.province_name,
                company_postal_code: invoice.sender?.postal_code,
              }}
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


          {/* Download Button Area */}
          <div className="bg-gray-50 border-t border-gray-100 p-6 flex justify-end items-center gap-3">
            <button
              onClick={() => setSelectedTemplate(selectedTemplate === 'classic' ? 'modern' : 'classic')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm shadow-sm"
              title="Ganti Desain"
            >
              <Layout size={16} /> <span>Ganti Desain</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all text-sm shadow-sm ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Download size={16} />
              )}
              {isDownloading ? 'Memproses PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
