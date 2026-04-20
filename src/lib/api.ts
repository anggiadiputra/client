import { getJWTToken } from './stackAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getOptions = async (): Promise<RequestInit> => {
  let token = await getJWTToken();

  // If no token found on first try, wait briefly and retry once.
  // This handles the race condition where Neon Auth session hasn't settled yet
  // when the dashboard first loads (right after OTP verification redirect).
  if (!token) {
    await new Promise(resolve => setTimeout(resolve, 800));
    token = await getJWTToken();
  }

  if (!token) {
    console.warn('[API] No token found after retry. Request will likely fail with 401.');
  }

  return {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  };
};

/**
 * handleResponse
 * Centralized response handler to catch 401s and other errors.
 *
 * IMPORTANT: We do NOT auto-logout on every 401. This caused a critical bug where:
 * - A race condition on dashboard load (session not yet settled) caused a 401
 * - handleResponse then immediately nuked the Neon Auth session
 * - User was effectively logged out right after signing in via OTP
 *
 * Instead: We just throw an error and let the component handle it gracefully.
 * Only the explicit "logout" action should destroy the session.
 */
const handleResponse = async (response: Response, defaultErrorMessage: string) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      // Log the 401 for debugging but DO NOT auto-logout.
      // The session may still be valid - this could be a race condition startup issue.
      console.warn(`[API] 401 on ${response.url} - session may be loading. Throwing error for caller to handle.`);
    }
    
    throw new Error(errorData.error || errorData.details || defaultErrorMessage);
  }
  
  return response.json();
};


// Customers
export const customersAPI = {
  getAll: async (page?: number, limit?: number, search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/customers${queryString}`, {
      ...(await getOptions()),
    });
    return handleResponse(response, 'Failed to fetch customers');
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    return handleResponse(response, 'Failed to create customer');
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

  batchDelete: async (ids: (number | string)[]) => {
    const response = await fetch(`${API_URL}/customers/batch-delete`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to batch delete customers');
    return response.json();
  },
};

// Services
export const servicesAPI = {
  getAll: async (page?: number, limit?: number, search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/services${queryString}`, {
      ...(await getOptions()),
    });
    return handleResponse(response, 'Failed to fetch services');
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/services`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    return handleResponse(response, 'Failed to create service');
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

  batchDelete: async (ids: (number | string)[]) => {
    const response = await fetch(`${API_URL}/services/batch-delete`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to batch delete services');
    return response.json();
  },
};

// Invoices
export const invoicesAPI = {
  getAll: async (page?: number, limit?: number, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${API_URL}/invoices${queryString}`, {
      ...(await getOptions()),
    });
    return handleResponse(response, 'Failed to fetch invoices');
  },

  getStats: async () => {
    const response = await fetch(`${API_URL}/invoices/stats/summary`, {
      ...(await getOptions()),
    });
    return handleResponse(response, 'Failed to fetch invoice stats');
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
    return handleResponse(response, 'Failed to fetch invoice');
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/invoices`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    return handleResponse(response, 'Failed to create invoice');
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

  batchDelete: async (ids: (number | string)[]) => {
    const response = await fetch(`${API_URL}/invoices/batch-delete`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to batch delete invoices');
    return response.json();
  },

  batchUpdateStatus: async (ids: (number | string)[], status: string) => {
    const response = await fetch(`${API_URL}/invoices/batch-status`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ ids, status }),
    });
    if (!response.ok) throw new Error('Failed to batch update status');
    return response.json();
  },
};

// Settings
export const settingsAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/settings`, {
      ...(await getOptions()),
    });
    return handleResponse(response, 'Failed to fetch settings');
  },

  update: async (data: any) => {
    const response = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    return handleResponse(response, 'Failed to update settings');
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
    return handleResponse(response, 'Failed to fetch bank accounts');
  },

  create: async (data: any) => {
    const response = await fetch(`${API_URL}/bank-accounts`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    return handleResponse(response, 'Failed to create bank account');
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
    return handleResponse(response, 'Failed to set primary bank account');
  },
};

// Logs
export const logsAPI = {
  getRecent: async () => {
    const options = await getOptions();
    const [waRes, emailRes] = await Promise.all([
      fetch(`${API_URL}/fonnte/logs?limit=5`, { ...options }),
      fetch(`${API_URL}/emails/logs?limit=5`, { ...options })
    ]);

    // Catch 401s specifically for both (but do NOT sign out, as it causes race condition false-logouts)
    if (waRes.status === 401 || emailRes.status === 401) {
      console.warn('[API] 401 on logsAPI.getRecent - session may still be loading. Returning empty logs.');
      return [];
    }

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
    return handleResponse(response, 'Failed to fetch user profile');
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

  batchDelete: async (ids: (number | string)[]) => {
    const response = await fetch(`${API_URL}/emails/logs/batch-delete`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to batch delete email logs');
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

  batchDelete: async (ids: (number | string)[]) => {
    const response = await fetch(`${API_URL}/fonnte/logs/batch-delete`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to batch delete WhatsApp logs');
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

// Wallet
export const walletAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/wallet`, {
      ...(await getOptions()),
    });
    if (!response.ok) throw new Error('Failed to fetch wallet data');
    return response.json();
  },

  initiateTopup: async (amount: number) => {
    const response = await fetch(`${API_URL}/wallet/topup`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) throw new Error('Failed to initiate top-up');
    return response.json();
  },
};

// Plans & Subscriptions
export const plansAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/plans`, {
      ...(await getOptions()),
    });
    return handleResponse(response, 'Failed to fetch plans');
  },

  upgrade: async (planId: number) => {
    const response = await fetch(`${API_URL}/plans/upgrade`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ planId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upgrade subscription');
    }
    return response.json();
  },
};

// Users (Admin Only)
export const usersAPI = {
  getAll: async (page?: number, limit?: number, search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${API_URL}/users${queryString}`, {
      ...(await getOptions()),
    });
    return handleResponse(response, 'Failed to fetch users');
  },

  update: async (id: number | string, data: any) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      ...(await getOptions()),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update user');
    }
    return response.json();
  },

  delete: async (id: number | string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      ...(await getOptions()),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete user');
    }
    return response.json();
  },

  batchDelete: async (ids: (number | string)[]) => {
    const response = await fetch(`${API_URL}/users/batch-delete`, {
      method: 'POST',
      ...(await getOptions()),
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to batch delete users');
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
