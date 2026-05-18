import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { AppSettings } from '../types';

interface AppContextType {
  settings: AppSettings;
  userRole: 'admin' | 'member' | null;
  turnstileSiteKey?: string;
  subscription: any | null;
  wallet: any | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setUserRole: (role: 'admin' | 'member' | null) => void;
  refreshSaaSData: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  appName: 'Billing System',
  logoUrl: undefined,
  turnstileSiteKey: undefined,
};

const AppContext = createContext<AppContextType>({
  settings: defaultSettings,
  userRole: null,
  turnstileSiteKey: undefined,
  subscription: null,
  wallet: null,
  theme: 'light',
  toggleTheme: () => {},
  updateSettings: () => {},
  setUserRole: () => {},
  refreshSaaSData: async () => {},
});

export const useAppSettings = () => useContext(AppContext);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(() => {
    // Check both sessionStorage and localStorage
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user).role || 'member';
      } catch (e) {
        return 'member';
      }
    }
    return null;
  });
  const [subscription, setSubscription] = useState<any | null>(null);
  const [wallet, setWallet] = useState<any | null>(null);

  // ── Theme management ──────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    // Respect system preference on first visit
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Temporarily disable transitions to avoid flash on initial load
    root.classList.add('no-transition');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    // Re-enable transitions after a brief moment
    const t = setTimeout(() => root.classList.remove('no-transition'), 50);
    return () => clearTimeout(t);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  // ─────────────────────────────────────────────────────────────────

  const refreshSaaSData = async () => {
    // Check both sessionStorage and localStorage for an active session
    const user = sessionStorage.getItem('user') || localStorage.getItem('user');
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (user && token) {
      try {
        const { authAPI } = await import('../lib/api');
        const data = await authAPI.me();
        if (data && data.user) {
          if (data.user.role) setUserRole(data.user.role);
          if (data.user.subscription) setSubscription(data.user.subscription);
          if (data.user.wallet) setWallet(data.user.wallet);
        }
      } catch (error) {
        console.warn('[AppContext] Failed to refresh SaaS data:', error);
      }
    }
  };

  // Always load from server first (source of truth), localStorage as fallback
  useEffect(() => {
    const initSettings = async () => {
      try {
        // Try to load from server first
        const { publicAPI } = await import('../lib/api');
        const data = await publicAPI.getSettings();
        
        if (data) {
          const serverSettings: AppSettings = {
            appName: data.app_name || defaultSettings.appName,
            logoUrl: data.company_logo || undefined,
            turnstileSiteKey: data.turnstile_site_key || undefined,
          };
          setSettings(serverSettings);
          
          // Also save to localStorage for offline/faster loading
          localStorage.setItem('app_settings', JSON.stringify(serverSettings));
        } else {
          // Fallback to localStorage if server returns empty
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading server settings, using localStorage fallback:', error);
        // Fallback to localStorage if server is unreachable
        loadFromLocalStorage();
      } finally {
        // Settings initialization complete
      }
    };

    initSettings();
  }, []);

  // Sync user profile/role from server on mount
  useEffect(() => {
    refreshSaaSData();
  }, []);

  const loadFromLocalStorage = () => {
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading app settings from localStorage:', error);
        setSettings(defaultSettings);
      }
    }
  };

  // Apply CSS variables when settings change
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider value={{ settings, userRole, turnstileSiteKey: settings.turnstileSiteKey, subscription, wallet, theme, toggleTheme, updateSettings, setUserRole, refreshSaaSData }}>
      {children}
    </AppContext.Provider>
  );
}
