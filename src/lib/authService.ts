const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AuthService {
  private safeParse<T>(value: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private persistAuth(user: any, token?: string) {
    const userJson = JSON.stringify(user);
    const currentUser = localStorage.getItem('user');
    const currentToken = localStorage.getItem('token');
    
    // Only update auth_sync if user or token actually changed
    let hasChanged = false;

    if (currentUser !== userJson) {
      hasChanged = true;
      sessionStorage.setItem('user', userJson);
      localStorage.setItem('user', userJson);
    }

    if (token && currentToken !== token) {
      hasChanged = true;
      sessionStorage.setItem('token', token);
      localStorage.setItem('token', token);
    }

    // Only signal other tabs if there was an actual change
    if (hasChanged) {
      localStorage.setItem('auth_sync', Date.now().toString());
    }
  }

  private clearLocalAuthState() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.setItem('auth_sync', Date.now().toString());
  }

  async register(email: string, password: string, firstName: string, lastName: string, companyName: string, turnstileToken: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        companyName,
        turnstileToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    this.persistAuth(data.user, data.token);
    return data;
  }

  async login(email: string, password: string, turnstileToken: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, turnstileToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    this.persistAuth(data.user, data.token);
    return data;
  }

  async logout() {
    console.log('[Auth] Performing complete local logout...');
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.warn('[Auth] Logout API call failed, clearing local state anyway');
    }

    this.clearLocalAuthState();
  }

  async forgotPassword(email: string, turnstileToken: string) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, turnstileToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to request password reset');
    }

    return response.json();
  }

  async resetPassword(email: string, password: string, token: string) {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, token }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to reset password');
    }

    return response.json();
  }

  getToken() {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  getUser() {
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    return this.safeParse<any>(user);
  }

  isAuthenticated() {
    return !!this.getUser() && !!this.getToken();
  }

  async me() {
    const { authAPI } = await import('./api');
    const data = await authAPI.me();
    if (data.user) {
      this.persistAuth(data.user);
    }
    return data;
  }
}

export default new AuthService();
