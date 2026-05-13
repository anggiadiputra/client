import { useState, useEffect } from 'react';
import { createInternalNeonAuth } from '@neondatabase/auth';
import { BetterAuthReactAdapter, authLocalization } from '@neondatabase/auth/react';
import authService from './authService';

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || '';

// Inisialisasi Auth Client
// Karena versi package ini mengekspor createAuthClient di root (bukan di /react), 
// dan menggunakan parameter (url, config), kita tetap menggunakan createInternalNeonAuth
// untuk mendapatkan adapter yang mendukung hook React.
const internalAuth = createInternalNeonAuth(NEON_AUTH_URL, {
  adapter: BetterAuthReactAdapter(),
});

// Cast ke any untuk menghindari error tipe data pada useSession() di versi beta ini
export const authClient = internalAuth.adapter as any;

export { authLocalization };

/**
 * useUser hook wrapper agar kompatibel dengan kode yang sudah ada.
 */
export function useUser() {
  const session = authClient.useSession();
  const [localUserData, setLocalUserData] = useState(authService.getUser());
  
  // Synchronize with local storage changes (e.g. from Profile update)
  useEffect(() => {
    const handleSync = () => {
      setLocalUserData(authService.getUser());
    };
    window.addEventListener('storage', handleSync);
    // Also listen for local changes in the same tab via a custom event if needed,
    // but authService already sets 'auth_sync' in localStorage which triggers this.
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const localToken = sessionStorage.getItem('token') || localStorage.getItem('token');
  const hasLocalAuth = !!(localUserData && localToken);
  
  if (session.isPending) {
    if (hasLocalAuth) {
      return {
        id: localUserData.id,
        email: localUserData.email,
        displayName: localUserData.firstName ? `${localUserData.firstName} ${localUserData.lastName}` : localUserData.email,
        role: localUserData.role || 'member',
      };
    }
    return undefined;
  }
  
  // Prioritize Local User Data if available (it may contain updated names/roles)
  if (hasLocalAuth) {
    return {
      id: localUserData.id,
      email: localUserData.email,
      displayName: localUserData.firstName ? `${localUserData.firstName} ${localUserData.lastName}` : localUserData.email,
      role: localUserData.role || 'member',
    };
  }

  if (session.data?.user) {
    return {
      id: session.data.user.id,
      email: session.data.user.email,
      displayName: session.data.user.name || session.data.user.email,
      role: 'member',
    };
  }
  
  return null;
}

/**
 * clearAllSessions
 * Menghapus seluruh residu sesi baik dari Neon Auth maupun Local Storage
 * untuk mencegah Session Hijacking/Pollution.
 */
function clearStaleLocalAuth() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function clearAllSessions() {
  console.log('[Auth] Clearing all global sessions (Local + Neon)...');
  
  // 1. Clear Local Cookies and LocalStorage via authService
  try {
    await authService.logout();
  } catch (e) {
    console.warn('[Auth] Local logout failed during cleanup, proceeding...');
  }
  
  // 2. Clear Neon session
  try {
    await authClient.signOut().catch(() => null);
  } catch (e) {
    // Ignore
  }
}

export async function getJWTToken() {
  // 1. Cek sesi Neon Auth terlebih dahulu (Google/SSO login)
  // Ini diprioritaskan untuk memastikan identitas modern selalu didahulukan
  try {
    const session = await authClient.getSession().catch(() => null);
    const neonToken = session?.data?.token;
    if (neonToken) {
      if (sessionStorage.getItem('token') || localStorage.getItem('token') || sessionStorage.getItem('user') || localStorage.getItem('user')) {
        console.warn('[Auth] Found active Neon session, clearing stale local auth state.');
        clearStaleLocalAuth();
      }
      return neonToken;
    }
  } catch (err) {
    console.warn('[Auth] Neon session check failed:', err);
  }

  // 2. Fallback ke token lokal (HS256) untuk email/password login tradisional
  const localToken = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (localToken && localToken !== 'null' && localToken !== 'undefined') {
    return localToken;
  }

  return null;
}

// Helpers for redirect URLs
export function getNeonLoginUrl(redirectTo = '/dashboard') {
  return `${NEON_AUTH_URL}/signin?redirect_to=${encodeURIComponent(window.location.origin + redirectTo)}`;
}

export function getNeonRegisterUrl(redirectTo = '/dashboard') {
  return `${NEON_AUTH_URL}/signup?redirect_to=${encodeURIComponent(window.location.origin + redirectTo)}`;
}

/**
 * neonSignOut (Legacy Alias)
 * Dialihkan ke clearAllSessions untuk pembersihan menyeluruh.
 */
export async function neonSignOut() {
  await clearAllSessions();
  window.location.href = '/login';
}

