import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { toTitleCase, formatAddress } from '../lib/formatter';
import { publicAPI } from '../lib/api';
import { SkeletonBlock, SkeletonTable } from '../components/LoadingSkeleton';

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

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden relative">
          {/* Close Button - Only show inside dashboard */}
          {!isPublicRoute && (
            <button
              onClick={() => navigate('/billing')}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
              title="Close"
            >
              <X size={24} />
            </button>
          )}
          {/* Invoice Content */}
          <div ref={invoiceRef} className="p-8 relative">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-10">
              {invoice.sender?.logo ? (
                <div className="flex-shrink-0">
                  <img 
                    src={invoice.sender.logo} 
                    alt="Logo" 
                    className="max-h-20 max-w-[200px] object-contain"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="text-2xl font-black text-blue-600 tracking-tighter uppercase">
                  {invoice.sender?.name || 'INVOICE'}
                </div>
              )}
              <div className="text-right">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                  {invoice.is_system 
                    ? (invoice.system_type === 'refund' ? 'Refund' : 'Kwitansi')
                    : 'Invoice'
                  }
                </h1>
                <div className="inline-block text-left space-y-1.5 text-gray-700" style={{ fontSize: '13px' }}>
                  <div className="flex border-b border-gray-100 pb-1">
                    <span className="w-24 font-medium text-gray-500">No. Ref</span>
                    <span className="font-bold text-gray-900">: {invoice.invoice_number}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-1">
                    <span className="w-24 font-medium text-gray-500">Tanggal</span>
                    <span className="font-bold text-gray-900">: {formatDate(invoice.issue_date)}</span>
                  </div>
                  {!invoice.is_system && (
                    <div className="flex border-b border-gray-100 pb-1">
                      <span className="w-24 font-medium text-gray-500">Jatuh Tempo</span>
                      <span className="font-bold text-gray-900">: {formatDate(invoice.due_date)}</span>
                    </div>
                  )}
                  {invoice.status === 'paid' && (
                    <div className="flex">
                      <span className="w-24 font-medium text-gray-500">Status</span>
                      <span className="font-black text-emerald-600">: LUNAS</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company & Client Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Company Info (The Sender) */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2 pb-2 border-b-2 border-gray-300 uppercase tracking-wider text-[10px]">
                  Diterbitkan Oleh
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{invoice.sender?.name || '-'}</p>
                  <p className="whitespace-pre-line">{formatAddress(invoice.sender) || '-'}</p>
                  {invoice.sender?.phone && (
                    <p>Ph: {invoice.sender.phone}</p>
                  )}
                  {invoice.sender?.email && (
                    <p>Email: {invoice.sender.email}</p>
                  )}
                </div>
              </div>

              {/* Client Info (The Receiver) */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2 pb-2 border-b-2 border-gray-300 uppercase tracking-wider text-[10px]">
                  Ditujukan Kepada
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{invoice.customer?.name || '-'}</p>
                  <p className="whitespace-pre-line">{formatAddress(invoice.customer)}</p>
                  {invoice.customer?.phone && <p>Ph: {invoice.customer.phone}</p>}
                  {invoice.customer?.email && <p>Email: {invoice.customer.email}</p>}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold uppercase tracking-tighter text-[11px]">
                    <th className="px-4 py-3 text-left first:rounded-tl-lg">Layanan / Produk</th>
                    <th className="px-4 py-3 text-left">Deskripsi</th>
                    <th className="px-4 py-3 text-center w-20">Jumlah</th>
                    <th className="px-4 py-3 text-right w-32">Harga</th>
                    {showDiscount && <th className="px-4 py-3 text-right w-24">Disc</th>}
                    <th className="px-4 py-3 text-right last:rounded-tr-lg w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {invoice.items?.map((item: any, index: number) => {
                    const isSystem = invoice.is_system;
                    const qty = isSystem ? 1 : (parseFloat(item.quantity) || 0);
                    const price = isSystem ? (parseFloat(item.amount) || 0) : (parseFloat(item.unit_price) || 0);
                    const discountPercent = isSystem ? 0 : (parseFloat(item.discount) || 0);
                    
                    const lineTotal = qty * price;
                    const discountAmount = lineTotal * (discountPercent / 100);
                    const itemTotal = lineTotal - discountAmount;

                    let productName = '-';
                    if (isSystem) {
                      productName = (invoice.system_type || 'System').toUpperCase();
                    } else {
                      const service = services.find((s: any) => s.id === item.service_id);
                      productName = service ? service.name : '-';
                    }

                    return (
                      <tr key={index} className="align-top">
                        <td className="px-4 py-3 font-semibold text-gray-900">{productName}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm whitespace-pre-line leading-relaxed break-words min-w-[200px]">
                          {item.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{qty}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-gray-600">{formatCurrency(price)}</td>
                        {showDiscount && <td className="px-4 py-3 text-right whitespace-nowrap text-gray-500">{discountPercent > 0 ? `${discountPercent}%` : '-'}</td>}
                        <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-gray-900">{formatCurrency(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 text-sm border-b border-gray-300">
                    <span className="font-semibold text-gray-700">Subtotal</span>
                    <span className="font-semibold whitespace-nowrap">{formatCurrency(subtotal)}</span>
                  </div>
                  {showTax && totalTax > 0 && (
                    <div className="flex justify-between py-2 text-sm border-b border-gray-300">
                      <span className="font-semibold text-gray-700">Pajak (PPN)</span>
                      <span className="font-semibold whitespace-nowrap">+ {formatCurrency(totalTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-sm">
                    <span className="font-bold text-gray-900 uppercase">Total Akhir</span>
                    <span className="font-bold whitespace-nowrap text-blue-600">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terbilang */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Terbilang</h4>
                <p className="text-sm italic text-gray-800 font-medium">
                  {capitalizeWords(numberToWords(Math.round(grandTotal)))} Rupiah
                </p>
              </div>
              {invoice.status === 'paid' && (
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-black text-xl border-2 border-green-200 rotate-[-2deg]">
                  PAID / LUNAS
                </div>
              )}
            </div>

            {/* Payment Info - Only show if NOT paid */}
            {invoice.status !== 'paid' && bankAccounts && bankAccounts.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Instruksi Pembayaran</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  {bankAccounts.map((account: any, index: number) => (
                    <p key={index}>
                      {account.bank_name} {account.account_number}
                    </p>
                  ))}
                  {bankAccounts[0]?.account_name && (
                    <p className="mt-1">a.n {bankAccounts[0].account_name}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Download Button Area */}
          <div className="bg-gray-50 border-t border-gray-100 p-6 flex justify-end items-center">
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
