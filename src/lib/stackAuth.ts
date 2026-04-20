/**
 * stackAuth.ts (Neon Auth)
 * 
 * Integrasi menggunakan @neondatabase/auth.
 */
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
  // useSession adalah hook dari BetterAuthReactAdapter
  const session = authClient.useSession();
  const localUser = authService.getUser();
  const localToken = localStorage.getItem('token');
  const hasLocalAuth = !!(localUser && localToken);
  
  if (session.isPending) {
    if (hasLocalAuth) {
      return {
        id: localUser.id,
        email: localUser.email,
        displayName: localUser.firstName ? `${localUser.firstName} ${localUser.lastName}` : localUser.email,
      };
    }
    return undefined;
  }
  
  if (session.data?.user) {
    return {
      id: session.data.user.id,
      email: session.data.user.email,
      displayName: session.data.user.name || session.data.user.email,
    };
  }

  if (hasLocalAuth) {
    return {
      id: localUser.id,
      email: localUser.email,
      displayName: localUser.firstName ? `${localUser.firstName} ${localUser.lastName}` : localUser.email,
    };
  }
  
  return null;
}

/**
 * clearAllSessions
 * Menghapus seluruh residu sesi baik dari Neon Auth maupun Local Storage
 * untuk mencegah Session Hijacking/Pollution.
 */
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
      // Jika ada token Neon, kita gunakan ini. 
      // Untuk keamanan, kita juga hapus token lokal yang mungkin 'stale'
      if (localStorage.getItem('token')) {
        console.warn('[Auth] Found active Neon session, clearing stale local token.');
        localStorage.removeItem('token');
      }
      return neonToken;
    }
  } catch (err) {
    console.warn('[Auth] Neon session check failed:', err);
  }

  // 2. Fallback ke token lokal (HS256) untuk email/password login tradisional
  const localToken = localStorage.getItem('token');
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

