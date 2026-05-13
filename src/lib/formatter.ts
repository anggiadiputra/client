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

export function formatAddress(params: any): string {
  if (!params) return '';
  
  // Extract values supporting both backend names and UI descriptive names
  const street = params.street || params.address || '';
  const village = params.village || params.village_name || '';
  const district = params.district || params.district_name || '';
  const regency = params.regency || params.regency_name || '';
  const province = params.province || params.province_name || '';
  const postal = params.postalCode || params.postal_code || '';

  const parts: string[] = [];
  
  if (street) parts.push(street.trim());
  if (village) parts.push(`Kel. ${village}`);
  if (district) parts.push(`Kec. ${district}`);
  if (regency) parts.push(regency);
  if (province) parts.push(province);
  
  let result = parts.map(toTitleCase).join(', ');
  
  if (postal) {
    result += ` ${postal}`;
  }
  
  return result || '-';
}
