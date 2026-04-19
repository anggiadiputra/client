import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { toTitleCase } from '../lib/formatter';
import { publicAPI } from '../lib/api';

export default function PublicInvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
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
      // Fetch invoice using centralized public API
      const invoiceData = await publicAPI.getInvoice(id);
      setInvoice(invoiceData);

      // Fetch company settings, bank accounts, and services in parallel using centralized public API
      const [settingsData, bankData, servicesData] = await Promise.all([
        publicAPI.getSettings().catch(() => null),
        publicAPI.getBankAccounts().catch(() => []),
        publicAPI.getServices().catch(() => []),
      ]);

      if (settingsData) setCompanySettings(settingsData);
      if (bankData) setBankAccounts(bankData);
      if (servicesData) setServices(servicesData);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
                   'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty',
                  'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 ? ' ' + numberToWords(num % 1000000) : '');
    if (num < 1000000000000) return numberToWords(Math.floor(num / 1000000000)) + ' Billion' + (num % 1000000000 ? ' ' + numberToWords(num % 1000000000) : '');
    return numberToWords(Math.floor(num / 1000000000000)) + ' Trillion' + (num % 1000000000000 ? ' ' + numberToWords(num % 1000000000000) : '');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Invoice Content */}
          <div ref={invoiceRef} className="p-8 relative">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              {companySettings?.company_logo ? (
                <div className="flex-shrink-0">
                  <img 
                    src={companySettings.company_logo} 
                    alt="Logo" 
                    className="max-h-24 max-w-[200px] object-contain"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div />
              )}
              <div className="text-right">
                <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">Invoice</h1>
                <div className="mt-4 space-y-1 text-gray-700" style={{ fontSize: '14px' }}>
                  <p><span className="inline-block w-24 text-left">Reference</span>: <span className="font-semibold text-gray-900">{invoice.invoice_number}</span></p>
                  <p><span className="inline-block w-24 text-left">Date</span>: <span className="font-semibold text-gray-900">{formatDate(invoice.issue_date)}</span></p>
                  <p><span className="inline-block w-24 text-left">Due Date</span>: <span className="font-semibold text-gray-900">{formatDate(invoice.due_date)}</span></p>
                  {invoice.status === 'paid' && (
                    <p><span className="inline-block w-24 text-left">Status</span>: <span className="font-bold text-emerald-600">PAID</span></p>
                  )}
                  {invoice.expires_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Link valid until: {new Date(invoice.expires_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Company & Client Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Company Info */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2 pb-2 border-b-2 border-gray-300">
                  Company Information
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{companySettings?.company_name || '-'}</p>
                  <p className="whitespace-pre-line">{toTitleCase(companySettings?.company_address || '-')}</p>
                  {companySettings?.company_phone && (
                    <p>Ph: {companySettings.company_phone}</p>
                  )}
                  {companySettings?.company_email && (
                    <p>Email: {companySettings.company_email}</p>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div>
                <h3 className="font-bold text-gray-800 mb-2 pb-2 border-b-2 border-gray-300">
                  Bill To
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{invoice.customer?.name || '-'}</p>
                  {invoice.customer?.address && <p className="whitespace-pre-line">{toTitleCase(invoice.customer.address)}</p>}
                  {invoice.customer?.city && invoice.customer?.province_name && (
                    <p>{toTitleCase(invoice.customer.city)}, {toTitleCase(invoice.customer.province_name)}</p>
                  )}
                  {invoice.customer?.postal_code && <p>Postal Code: {invoice.customer.postal_code}</p>}
                  {invoice.customer?.phone && <p>Ph: {invoice.customer.phone}</p>}
                  {invoice.customer?.email && <p>Email: {invoice.customer.email}</p>}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Product</th>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                    <th className="px-4 py-3 text-center font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Price</th>
                    {showDiscount && <th className="px-4 py-3 text-right font-semibold">Discount</th>}
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {invoice.items?.map((item: any, index: number) => {
                    const qty = parseFloat(item.quantity) || 0;
                    const price = parseFloat(item.unit_price) || 0;
                    const discountPercent = parseFloat(item.discount) || 0;
                    
                    const lineTotal = qty * price;
                    const discountAmount = lineTotal * (discountPercent / 100);
                    const itemTotal = lineTotal - discountAmount;

                    const service = services.find((s: any) => s.id === item.service_id);
                    const serviceName = service ? service.name : '-';

                    return (
                      <tr key={index} className="align-top">
                        <td className="px-4 py-3">{serviceName}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-pre-line">{item.description || '-'}</td>
                        <td className="px-4 py-3 text-center">{qty}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(price)}</td>
                        {showDiscount && <td className="px-4 py-3 text-right whitespace-nowrap">{discountPercent > 0 ? `${discountPercent}%` : '-'}</td>}
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{formatCurrency(itemTotal)}</td>
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
                      <span className="font-semibold text-gray-700">Tax</span>
                      <span className="font-semibold whitespace-nowrap">+ {formatCurrency(totalTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-sm">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold whitespace-nowrap">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terbilang */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-1 italic">Amount in Words</h4>
              <p className="text-sm italic text-gray-700 lowercase">
                {numberToWords(Math.round(grandTotal))} Rupiah only
              </p>
            </div>

            {/* Payment Info */}
            {bankAccounts && bankAccounts.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Payment</h4>
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
