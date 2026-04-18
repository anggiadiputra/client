/**
 * Template generator for invoice WhatsApp messages
 * Supports variables: {customer_name}, {invoice_number}, {total_amount}, {due_date}, {company_name}
 */

/**
 * Format currency to Indonesian Rupiah
 */
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to Indonesian locale
 */
export const formatDateIndonesian = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Generate default invoice template message
 * @param invoice - Invoice data
 * @param company - Company information
 * @returns Formatted message string
 */
export const generateInvoiceTemplate = (
  invoice: {
    id?: number;
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
  },
  customer: {
    name: string;
  },
  company: {
    company_name?: string;
    company_phone?: string;
    company_email?: string;
    wa_invoice_template?: string;
  }
): string => {
  const customerName = customer.name || 'Customer';
  const companyName = company.company_name || 'Kami';
  const invoiceNumber = invoice.invoice_number;
  const totalAmount = formatRupiah(invoice.total_amount);
  const issueDate = formatDateIndonesian(invoice.issue_date);
  const dueDate = formatDateIndonesian(invoice.due_date);
  const status = invoice.status.toUpperCase();

  let tpl = company.wa_invoice_template;
  
  // Choose template based on status
  if (invoice.status === 'paid' && company.wa_paid_template) {
    tpl = company.wa_paid_template;
  } else if ((invoice.status === 'overdue' || invoice.status === 'sent') && company.wa_reminder_template) {
    // Use reminder template if status is already sent or overdue
    // Note: If user wants the initial invoice sending, we might need a way to differentiate.
    // For now, let's assume if it's already 'sent', we're sending a reminder.
    tpl = company.wa_reminder_template;
  }

  if (tpl) {
    const publicUrl = window.location.origin + '/public/invoice/' + (invoice.invoice_number || '');
    let result = tpl;
    result = result.replace(/{customer_name}/g, customerName);
    result = result.replace(/{company_name}/g, companyName);
    result = result.replace(/{invoice_number}/g, invoiceNumber);
    result = result.replace(/{issue_date}/g, issueDate);
    result = result.replace(/{due_date}/g, dueDate);
    result = result.replace(/{total_amount}/g, totalAmount);
    result = result.replace(/{public_invoice_url}/g, publicUrl);
    return result;
  }

  let message = `Halo ${customerName},\n\n`;
  message += `Berikut adalah invoice dari ${companyName}:\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📄 *Invoice: ${invoiceNumber}*\n`;
  message += `💰 *Total: ${totalAmount}*\n`;
  message += `📅 *Tanggal: ${issueDate}*\n`;
  message += `⏰ *Jatuh Tempo: ${dueDate}*\n`;
  message += `📊 *Status: ${status}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Add items if available
  if (invoice.items && invoice.items.length > 0) {
    message += `*Detail Layanan:*\n`;
    invoice.items.forEach((item, index) => {
      const itemTotal = formatRupiah(item.quantity * item.unit_price);
      message += `${index + 1}. ${item.description}\n`;
      message += `   ${item.quantity} x ${formatRupiah(item.unit_price)} = ${itemTotal}\n`;
    });
    message += `\n`;
  }

  // Add tax if exists
  if (invoice.tax_amount && invoice.tax_amount > 0) {
    message += `Pajak: ${formatRupiah(invoice.tax_amount)}\n`;
  }

  // Add paid amount if exists
  if (invoice.paid_amount && invoice.paid_amount > 0) {
    const remaining = invoice.total_amount - invoice.paid_amount;
    message += `Dibayar: ${formatRupiah(invoice.paid_amount)}\n`;
    message += `Sisa: ${formatRupiah(remaining)}\n`;
  }

  // Add notes if exists
  if (invoice.notes) {
    message += `\n*Catatan:*\n${invoice.notes}\n`;
  }

  // Add public link
  const publicUrl = window.location.origin + '/public/invoice/' + (invoice.invoice_number || '');
  message += `\n*Lihat Detail & Bayar:*\n${publicUrl}\n`;
  message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Mohon segera melakukan pembayaran sebelum ${dueDate}.\n\n`;
  message += `Jika ada pertanyaan, jangan ragu untuk menghubungi kami.\n\n`;
  message += `Terima kasih,\n${companyName}`;

  if (company.company_phone) {
    message += `\n📞 ${company.company_phone}`;
  }

  if (company.company_email) {
    message += `\n✉️ ${company.company_email}`;
  }

  return message;
};

/**
 * Generate payment reminder template
 */
export const generatePaymentReminderTemplate = (
  invoice: {
    invoice_number: string;
    total_amount: number;
    due_date: string;
  },
  customer: {
    name: string;
  },
  company: {
    company_name?: string;
  }
): string => {
  const customerName = customer.name || 'Customer';
  const companyName = company.company_name || 'Kami';
  const invoiceNumber = invoice.invoice_number;
  const totalAmount = formatRupiah(invoice.total_amount);
  const dueDate = formatDateIndonesian(invoice.due_date);

  let message = `Halo ${customerName},\n\n`;
  message += `Ini adalah pengingat untuk invoice ${invoiceNumber} sebesar ${totalAmount}.\n\n`;
  message += `⏰ Jatuh tempo: ${dueDate}\n\n`;
  message += `Mohon segera melakukan pembayaran. Terima kasih!\n\n`;
  message += `Salam,\n${companyName}`;

  return message;
};
