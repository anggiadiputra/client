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

export function formatAddress(params: {
  street?: string | null;
  village?: string | null;
  district?: string | null;
  regency?: string | null;
  province?: string | null;
  postalCode?: string | null;
}): string {
  const parts: string[] = [];
  
  if (params.street) {
    parts.push(params.street.trim());
  }
  
  if (params.village) {
    parts.push(`Kel. ${params.village}`);
  }
  
  if (params.district) {
    parts.push(`Kec. ${params.district}`);
  }
  
  if (params.regency) {
    parts.push(params.regency);
  }
  
  if (params.province) {
    parts.push(params.province);
  }
  
  let result = parts.map(toTitleCase).join(', ');
  
  if (params.postalCode) {
    result += ` ${params.postalCode}`;
  }
  
  return result;
}
