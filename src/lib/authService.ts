const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AuthService {
  async register(email, password, firstName, lastName, companyName, turnstileToken) {
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
        turnstileToken
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    // Save both user data and token for reliable frontend access
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  }

  async login(email, password, turnstileToken) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, turnstileToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    // Save both user data and token for reliable frontend access
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  }

  async logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch(e) {
      // Ignored
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async forgotPassword(email, turnstileToken) {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, turnstileToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request password reset');
    }

    return await response.json();
  }

  async resetPassword(email, password, token) {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }

    return await response.json();
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!this.getUser();
  }

  async me() {
    const { authAPI } = await import('./api');
    const data = await authAPI.me();
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }
}

export default new AuthService();
