import React from 'react';
import { formatAddress } from '../../lib/formatter';

interface ModernTemplateProps {
  invoice: any;
  companySettings: any;
  bankAccounts: any[];
  services: any[];
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  numberToWords: (n: number) => string;
  capitalizeWords: (str: string) => string;
  showDiscount: boolean;
  showTax: boolean;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  invoiceRef: React.RefObject<HTMLDivElement>;
}

export default function ModernTemplate({
  invoice,
  companySettings,
  bankAccounts,
  services,
  formatDate,
  formatCurrency,
  numberToWords,
  capitalizeWords,
  showDiscount,
  showTax,
  subtotal,
  totalTax,
  grandTotal,
  invoiceRef
}: ModernTemplateProps) {
  return (
    <div 
      ref={invoiceRef} 
      id="invoice-content" 
      className="p-0 relative bg-white overflow-hidden shadow-2xl border border-slate-200 rounded-3xl"
    >
      {/* Modern Header with Dark Background */}
      <div className="bg-slate-900 text-white p-12 flex justify-between items-center">
        <div>
          {companySettings?.company_logo && !invoice.is_system ? (
            <img 
              src={companySettings.company_logo} 
              alt="Logo" 
              className="max-h-16 max-w-[200px] object-contain brightness-0 invert"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="text-2xl font-black tracking-tighter uppercase">
              {invoice.is_system ? 'Kwitansi' : (companySettings?.company_name || 'INVOICE')}
            </div>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-6xl font-black uppercase tracking-tighter opacity-20 absolute top-8 right-12">
            INVOICE
          </h1>
          <div className="relative z-10 pt-4">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Invoice Number</p>
            <p className="text-2xl font-bold"># {invoice.invoice_number}</p>
          </div>
        </div>
      </div>

      <div className="p-12">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-16 mb-16">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">From</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-bold text-slate-900 text-lg uppercase tracking-tight">
                  {invoice.is_system ? 'Sistem Billing' : (companySettings?.company_name || '-')}
                </p>
                <p className="leading-relaxed">
                  {invoice.is_system ? 'Platform Management' : formatAddress({
                    street: companySettings?.company_address,
                    village: companySettings?.village_name,
                    district: companySettings?.district_name,
                    regency: companySettings?.regency_name,
                    province: companySettings?.province_name,
                    postalCode: companySettings?.company_postal_code,
                  })}
                </p>
                {!invoice.is_system && companySettings?.company_phone && <p>Ph: {companySettings.company_phone}</p>}
                {!invoice.is_system && companySettings?.company_email && <p>Email: {companySettings.company_email}</p>}
              </div>
            </div>

            <div className="flex gap-8 pt-4 border-t border-slate-100">
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Issue Date</p>
                 <p className="text-sm font-bold text-slate-800">{formatDate(invoice.issue_date)}</p>
               </div>
               {!invoice.is_system && (
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Due Date</p>
                   <p className="text-sm font-bold text-slate-800">{formatDate(invoice.due_date)}</p>
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">To</p>
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-bold text-slate-900 text-lg uppercase tracking-tight">
                  {invoice.is_system 
                    ? (companySettings?.company_name || 'User') 
                    : (invoice.customer?.name || invoice.customer_name || '-')
                  }
                </p>
                {invoice.is_system ? (
                   <p className="leading-relaxed">{formatAddress({
                     street: companySettings?.company_address,
                     village: companySettings?.village_name,
                     district: companySettings?.district_name,
                     regency: companySettings?.regency_name,
                     province: companySettings?.province_name,
                     postalCode: companySettings?.company_postal_code,
                   })}</p>
                ) : (
                  <p className="leading-relaxed">{formatAddress(invoice.customer)}</p>
                )}
                <p>Ph: {invoice.is_system ? companySettings?.company_phone : (invoice.customer?.phone || '-')}</p>
                <p>Email: {invoice.is_system ? companySettings?.company_email : (invoice.customer?.email || '-')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Table */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-center w-24">Qty</th>
                <th className="px-6 py-4 text-right w-40">Unit Price</th>
                {showDiscount && <th className="px-6 py-4 text-right w-24">Disc</th>}
                <th className="px-8 py-4 text-right w-44">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                  <tr key={index} className="align-top hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-6">
                      <p className="font-bold text-slate-900 mb-1">{productName}</p>
                      <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed max-w-md">
                        {item.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-6 text-center text-slate-600 font-medium">{qty}</td>
                    <td className="px-6 py-6 text-right whitespace-nowrap text-slate-600 font-medium">{formatCurrency(price)}</td>
                    {showDiscount && (
                      <td className="px-6 py-6 text-right whitespace-nowrap text-slate-400 font-medium">
                        {discountPercent > 0 ? `${discountPercent}%` : '-'}
                      </td>
                    )}
                    <td className="px-8 py-6 text-right whitespace-nowrap font-black text-slate-900 text-base">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-start gap-16">
          <div className="flex-1 space-y-8">
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/50 rounded-full -mr-12 -mt-12"></div>
               <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 mb-3">Terbilang</h4>
               <p className="text-base italic text-slate-800 font-bold leading-relaxed relative z-10">
                 "{capitalizeWords(numberToWords(Math.round(grandTotal)))} Rupiah"
               </p>
            </div>

            {invoice.status !== 'paid' && bankAccounts.length > 0 && (
              <div className="p-8 border border-slate-100 rounded-3xl">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 mb-6">Payment Instructions</h4>
                <div className="grid grid-cols-2 gap-8">
                  {bankAccounts.map((acc, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{acc.bank_name}</p>
                      <p className="text-lg font-bold text-slate-900 tracking-tight">{acc.account_number}</p>
                      <p className="text-[10px] text-slate-400 font-bold">A/N {acc.account_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-80 space-y-4 pt-4">
            <div className="flex justify-between items-center text-sm px-4">
              <span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Subtotal</span>
              <span className="text-slate-900 font-bold">{formatCurrency(subtotal)}</span>
            </div>
            {showTax && totalTax > 0 && (
              <div className="flex justify-between items-center text-sm px-4">
                <span className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Pajak (PPN)</span>
                <span className="text-slate-900 font-bold">+ {formatCurrency(totalTax)}</span>
              </div>
            )}
            <div className="pt-6 mt-4 border-t-2 border-slate-900 flex justify-between items-center px-4">
              <span className="text-base font-black text-slate-900 uppercase tracking-tighter">Total Amount</span>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(grandTotal)}</span>
            </div>
            
            {invoice.status === 'paid' && (
              <div className="mt-12 flex justify-center">
                <div className="px-8 py-4 bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-2xl font-black text-3xl uppercase tracking-tighter rotate-[-5deg] shadow-lg shadow-emerald-100">
                  PAID
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em] mb-4">
            Thank you for your business
          </p>
          <div className="h-1 w-12 bg-slate-100 mx-auto rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
