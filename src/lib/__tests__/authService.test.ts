import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './authService';

// Mock localStorage and sessionStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock fetch
global.fetch = vi.fn();

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should save user and token to both storages and set auth_sync', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com' },
        token: 'jwt-token',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
        turnstileToken: 'token',
      });

      expect(result).toEqual(mockResponse);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_sync', expect.any(String));
    });
  });

  describe('login', () => {
    it('should save user and token to both storages and set auth_sync', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com' },
        token: 'jwt-token',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password',
        turnstileToken: 'token',
      });

      expect(result).toEqual(mockResponse);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_sync', expect.any(String));
    });
  });

  describe('logout', () => {
    it('should clear user and token from both storages and set auth_sync', () => {
      authService.logout();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_sync', expect.any(String));
    });
  });

  describe('getToken', () => {
    it('should return sessionStorage token first, then localStorage', () => {
      mockSessionStorage.setItem('token', 'session-token');
      mockLocalStorage.setItem('token', 'local-token');

      expect(authService.getToken()).toBe('session-token');

      mockSessionStorage.removeItem('token');
      expect(authService.getToken()).toBe('local-token');
    });
  });

  describe('getUser', () => {
    it('should return sessionStorage user first, then localStorage', () => {
      const user = { id: 1, email: 'test@example.com' };
      mockSessionStorage.setItem('user', JSON.stringify(user));
      mockLocalStorage.setItem('user', JSON.stringify({ id: 2, email: 'local@example.com' }));

      expect(authService.getUser()).toEqual(user);

      mockSessionStorage.removeItem('user');
      expect(authService.getUser()).toEqual({ id: 2, email: 'local@example.com' });
    });
  });

  describe('refreshProfile', () => {
    it('should update user in both storages', async () => {
      const mockResponse = {
        user: { id: 1, email: 'updated@example.com' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.refreshProfile();

      expect(result).toEqual(mockResponse);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
    });
  });
});