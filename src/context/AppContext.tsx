import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { AppSettings } from '../types';

interface AppContextType {
  settings: AppSettings;
  userRole: 'admin' | 'member' | null;
  turnstileSiteKey?: string;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setUserRole: (role: 'admin' | 'member' | null) => void;
}

const defaultSettings: AppSettings = {
  appName: 'Invoizes - Pro Billing System',
  logoUrl: undefined,
  turnstileSiteKey: undefined,
};

const AppContext = createContext<AppContextType>({
  settings: defaultSettings,
  userRole: null,
  turnstileSiteKey: undefined,
  updateSettings: () => {},
  setUserRole: () => {},
});

export const useAppSettings = () => useContext(AppContext);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user).role || 'member';
      } catch (e) {
        return 'member';
      }
    }
    return null;
  });

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
    const syncUser = async () => {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const authService = (await import('../lib/authService')).default;
          const data = await authService.me();
          if (data && data.user && data.user.role) {
            setUserRole(data.user.role);
          }
        } catch (error) {
          console.warn('[AppContext] Failed to sync user role:', error);
        }
      }
    };

    syncUser();
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
    
    // Update page title
    document.title = settings.appName;
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider value={{ settings, userRole, turnstileSiteKey: settings.turnstileSiteKey, updateSettings, setUserRole }}>
      {children}
    </AppContext.Provider>
  );
}
