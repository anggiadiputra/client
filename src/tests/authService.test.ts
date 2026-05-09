import { describe, it, expect, beforeEach, vi } from 'vitest';
import authService from '../lib/authService';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('stores user and token in both session and local storage', async () => {
      const mockResponse = {
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'member',
        },
        token: 'test-token-123',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      );

      await authService.register('test@example.com', 'password123', 'Test', 'User', 'Test Co', 'turnstile-token');

      // Check sessionStorage
      expect(sessionStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
      expect(sessionStorage.getItem('token')).toBe('test-token-123');

      // Check localStorage
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
      expect(localStorage.getItem('token')).toBe('test-token-123');

      // Check auth_sync event
      expect(localStorage.getItem('auth_sync')).toBeTruthy();
    });

    it('throws error on failed registration', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Email already exists' }),
        })
      );

      await expect(
        authService.register('test@example.com', 'password123', 'Test', 'User', 'Test Co', 'token')
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('stores user and token in both storages on successful login', async () => {
      const mockResponse = {
        user: {
          id: 2,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Test',
          role: 'member',
        },
        token: 'login-token-456',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      );

      await authService.login('user@example.com', 'password123', 'turnstile-token');

      expect(sessionStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
      expect(localStorage.getItem('token')).toBe('login-token-456');
    });
  });

  describe('logout', () => {
    it('clears all auth data from both storages', async () => {
      // Setup initial state
      sessionStorage.setItem('user', JSON.stringify({ id: 1 }));
      sessionStorage.setItem('token', 'some-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      localStorage.setItem('token', 'some-token');

      global.fetch = vi.fn(() => Promise.resolve({ ok: true }));

      await authService.logout();

      expect(sessionStorage.getItem('user')).toBeNull();
      expect(sessionStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('auth_sync')).toBeTruthy(); // auth_sync should be set
    });
  });

  describe('getToken', () => {
    it('returns token from sessionStorage if available', () => {
      sessionStorage.setItem('token', 'session-token');
      localStorage.setItem('token', 'local-token');

      expect(authService.getToken()).toBe('session-token');
    });

    it('falls back to localStorage if sessionStorage is empty', () => {
      localStorage.setItem('token', 'local-token');

      expect(authService.getToken()).toBe('local-token');
    });

    it('returns null if no token exists', () => {
      expect(authService.getToken()).toBeNull();
    });
  });

  describe('getUser', () => {
    it('returns user from sessionStorage if available', () => {
      const user = { id: 1, email: 'test@example.com' };
      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify({ id: 2 }));

      expect(authService.getUser()).toEqual(user);
    });

    it('falls back to localStorage if sessionStorage is empty', () => {
      const user = { id: 2, email: 'local@example.com' };
      localStorage.setItem('user', JSON.stringify(user));

      expect(authService.getUser()).toEqual(user);
    });

    it('returns null if no user exists', () => {
      expect(authService.getUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when user exists', () => {
      sessionStorage.setItem('user', JSON.stringify({ id: 1 }));
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('returns false when no user exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('me', () => {
    it('updates user in both storages', async () => {
      const updatedUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: updatedUser }),
        })
      );

      await authService.me();

      expect(sessionStorage.getItem('user')).toBe(JSON.stringify(updatedUser));
      expect(localStorage.getItem('user')).toBe(JSON.stringify(updatedUser));
    });
  });
});
