import React from 'react';
import { formatAddress } from '../../lib/formatter';

interface ClassicTemplateProps {
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

export default function ClassicTemplate({
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
}: ClassicTemplateProps) {
  return (
    <div 
      ref={invoiceRef} 
      id="invoice-content" 
      className="p-8 md:p-12 relative bg-white shadow-xl border border-gray-200 rounded-xl overflow-hidden"
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
  );
}
