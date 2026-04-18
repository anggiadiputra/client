// Customers
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  province_id?: string;
  regency_id?: string;
  district_id?: string;
  village_id?: string;
  province_name?: string;
  regency_name?: string;
  district_name?: string;
  village_name?: string;
}

// Services
export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
}

// Invoices
export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  grand_total?: number;
  tax_amount?: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'sent';
  notes?: string;
  bank_account_id?: number;
  payment_qr_url?: string;
  url_token?: string;
  show_discount?: boolean;
  show_tax?: boolean;
  show_unit?: boolean;
  items?: any[];
}

export interface DashboardStats {
  total_income: string | number;
  total_pending: string | number;
  total_paid: string | number;
  total_invoices: number;
}

export interface MonthlyData {
  month: string;
  total_amount: string | number;
  paid_amount: string | number;
}

export interface DashboardLog {
  id: number;
  type: 'whatsapp' | 'email';
  target?: string;
  recipient?: string;
  subject?: string;
  message_type?: string;
  status: string;
  sent_at: string;
}

export interface AppSettings {
  appName: string;
  logoUrl?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  role: 'admin' | 'member';
  created_at: string;
}
