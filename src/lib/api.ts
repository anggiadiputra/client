import { getJWTToken } from './stackAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getOptions = async (): Promise<RequestInit> => {
  const token = await getJWTToken();
  if (token) {
    if (token.length > 50) {
      console.log(`[API] Sending token (RS256/Neon): ${token.substring(0, 10)}...`);
    } else {
      console.log(`[API] Sending token (HS256/Local): ${token.substring(0, 10)}...`);
    }
  } else {
    console.warn('[API] No token found! Request will likely fail with 401.');
  }
  
  return {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  };
};

// Customers
export const customersAPI = {
  getAll: async (page?: number, limit?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (search) params.append('search', search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/customers${queryString}`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch customers');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create customer');
    return response.json();
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_URL}/customers/${id}`, {
      method: 'PUT',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update customer');
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_URL}/customers/${id}`, {
      method: 'DELETE',
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to delete customer');
    return response.json();
  },
};

// Services
export const servicesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/services`, {
      ...(await getOptions()),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || 'Failed to fetch services');
    }
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/services`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || 'Failed to create service');
    }
    return response.json();
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_URL}/services/${id}`, {
      method: 'PUT',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update service');
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_URL}/services/${id}`, {
      method: 'DELETE',
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to delete service');
    return response.json();
  },
};

// Invoices
export const invoicesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/invoices`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  },

  getStats: async () => {
    const response = await fetch(`${API_URL}/invoices/stats/summary`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  getMonthlyStats: async () => {
    const response = await fetch(`${API_URL}/invoices/stats/monthly`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch monthly stats');
    return response.json();
  },

  getById: async (id: number | string) => {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch invoice');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/invoices`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create invoice');
    return response.json();
  },

  update: async (id: number | string, data: any) => {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
      method: 'PUT',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update invoice');
    }
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
      method: 'DELETE',
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to delete invoice');
    return response.json();
  },

  updateStatus: async (id: number, status: string) => {
    const response = await fetch(`${API_URL}/invoices/${id}/status`, {
      method: 'PATCH',
      ...(await getOptions()),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update invoice');
    return response.json();
  },
};

// Settings
export const settingsAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/settings`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  update: async (data: any) => {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  },

  testS3: async (data: any) => {
    try {
      const response = await fetch(`${API_URL}/settings/test-s3`, {
        method: 'POST',
        ...(await getOptions()),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Log the full error response for debugging
        console.error('S3 test error response:', result);

        // Extract the actual error message from backend
        const errorMessage = result?.message || result?.error || 'Failed to test S3 connection';
        throw new Error(errorMessage);
      }

      return result;
    } catch (error: any) {
      // Re-throw if already an Error object
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to test S3 connection');
    }
  },

  testSmtp: async (data: any) => {
    try {
      const response = await fetch(`${API_URL}/settings/test-smtp`, {
        method: 'POST',
        ...(await getOptions()),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('SMTP test error response:', result);
        const errorMessage = result?.message || result?.error || 'Failed to test SMTP connection';
        throw new Error(errorMessage);
      }

      return result;
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to test SMTP connection');
    }
  },

  // Global system settings (Admin Only)
  getSystem: async () => {
    const response = await fetch(`${API_URL}/settings/system`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch system settings');
    return response.json();
  },

  updateSystem: async (data: any) => {
    const response = await fetch(`${API_URL}/settings/system`, {
      method: 'PUT',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update system settings');
    return response.json();
  },
};

// Bank Accounts
export const bankAccountsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/bank-accounts`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch bank accounts');
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/bank-accounts`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create bank account');
    return response.json();
  },

  update: async (id: number, data: any) => {
    const response = await fetch(`${API_URL}/bank-accounts/${id}`, {
      method: 'PUT',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update bank account');
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_URL}/bank-accounts/${id}`, {
      method: 'DELETE',
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to delete bank account');
    return response.json();
  },

  setPrimary: async (id: number) => {
    const response = await fetch(`${API_URL}/bank-accounts/${id}/primary`, {
      method: 'PATCH',
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to set primary bank account');
    return response.json();
  },
};

// Logs
export const logsAPI = {
  getRecent: async () => {
    const [waRes, emailRes] = await Promise.all([
      fetch(`${API_URL}/fonnte/logs?limit=5`, { ...(await getOptions()) }),
      fetch(`${API_URL}/emails/logs?limit=5`, { ...(await getOptions()) })
    ]);
    
    const waData = waRes.ok ? await waRes.json() : { logs: [] };
    const emailData = emailRes.ok ? await emailRes.json() : { logs: [] };
    
    // Combine and sort by date
    const combined = [
      ...(waData.logs || []).map((l: any) => ({ ...l, type: 'whatsapp' })),
      ...(emailData.logs || []).map((l: any) => ({ ...l, type: 'email' }))
    ].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    
    return combined.slice(0, 10);
  }
};

// Auth
export const authAPI = {
  me: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  },

  syncNeon: async (token?: string) => {
    const options = await getOptions();
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    const response = await fetch(`${API_URL}/auth/sync-neon`, {
      method: 'POST',
      ...options,
    });
    if (!response.ok) throw new Error('Failed to sync identity');
    return response.json();
  },
};

// Emails
export const emailsAPI = {
  getAll: async (page = 1, limit = 15) => {
    const response = await fetch(`${API_URL}/emails/logs?page=${page}&limit=${limit}`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch email logs');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/emails/logs/${id}`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch email log details');
    return response.json();
  },

  sendInvoice: async (invoiceId: string | number) => {
    const response = await fetch(`${API_URL}/emails/send-invoice`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ invoiceId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send email');
    }
    return response.json();
  },
};

// WhatsApp (Fonnte)
export const whatsappAPI = {
  getAll: async (page = 1, limit = 15) => {
    const response = await fetch(`${API_URL}/fonnte/logs?page=${page}&limit=${limit}`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch WhatsApp logs');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/fonnte/logs/${id}`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch WhatsApp log details');
    return response.json();
  },

  testConnection: async (token: string, testTarget?: string, testMessage?: string) => {
    const response = await fetch(`${API_URL}/fonnte/test-connection`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ token, testTarget, testMessage }),
    });
    if (!response.ok) throw new Error('Failed to test connection');
    return response.json();
  },

  validateNumber: async (target: string, countryCode: string = '62') => {
    const response = await fetch(`${API_URL}/fonnte/validate-number`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ target, countryCode }),
    });
    if (!response.ok) throw new Error('Failed to validate number');
    return response.json();
  },

  sendMessage: async (data: any) => {
    const response = await fetch(`${API_URL}/fonnte/send`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  sendInvoice: async (data: any) => {
    const response = await fetch(`${API_URL}/fonnte/send-invoice`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send WhatsApp invoice');
    return response.json();
  },
};

// Regions
export const regionsAPI = {
  getProvinces: async () => {
    const response = await fetch(`${API_URL}/regions/provinces`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch provinces');
    return response.json();
  },

  getRegencies: async (provinceId: string) => {
    const response = await fetch(`${API_URL}/regions/provinces/${provinceId}/regencies`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch regencies');
    return response.json();
  },

  getDistricts: async (regencyId: string) => {
    const response = await fetch(`${API_URL}/regions/regencies/${regencyId}/districts`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch districts');
    return response.json();
  },

  getVillages: async (districtId: string) => {
    const response = await fetch(`${API_URL}/regions/districts/${districtId}/villages`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch villages');
    return response.json();
  },
};

// Users (Admin Only)
export const usersAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/users`, {
      ...(await getOptions()),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch users');
    }
    return response.json();
  },
};

// Public Endpoints
export const publicAPI = {
  getInvoice: async (id: string) => {
    const response = await fetch(`${API_URL}/public/invoices/${id}`);
    if (!response.ok) throw new Error('Failed to fetch public invoice');
    return response.json();
  },

  getSettings: async () => {
    const response = await fetch(`${API_URL}/public/settings`);
    if (!response.ok) throw new Error('Failed to fetch public settings');
    return response.json();
  },

  getBankAccounts: async () => {
    const response = await fetch(`${API_URL}/public/bank-accounts`);
    if (!response.ok) throw new Error('Failed to fetch public bank accounts');
    return response.json();
  },

  getServices: async () => {
    const response = await fetch(`${API_URL}/public/services`);
    if (!response.ok) throw new Error('Failed to fetch public services');
    return response.json();
  },

  verifyTurnstile: async (token: string) => {
    const response = await fetch(`${API_URL}/public/verify-turnstile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verification failed');
    }
    return await response.json();
  },
};
