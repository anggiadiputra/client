export function toTitleCase(str: string | undefined | null): string {
  if (!str) return ' - ';
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

export function formatRupiah(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return 'Rp0';
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `Rp${new Intl.NumberFormat('id-ID').format(Math.round(val || 0))}`;
}

export function formatDate(date: string | Date | undefined | null, options: Intl.DateTimeFormatOptions = {}): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  };
  
  return d.toLocaleDateString('id-ID', defaultOptions);
}
