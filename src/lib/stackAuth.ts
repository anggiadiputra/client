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
  
  if (session.isPending) {
    if (localUser) {
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

  if (localUser) {
    return {
      id: localUser.id,
      email: localUser.email,
      displayName: localUser.firstName ? `${localUser.firstName} ${localUser.lastName}` : localUser.email,
    };
  }
  
  return null;
}

/**
 * Sign out menggunakan authClient.
 */
export async function neonSignOut() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  try {
    await authClient.signOut();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
  
  window.location.href = '/login';
}

export async function getJWTToken() {
  // 1. Prioritaskan token lokal (HS256) untuk kecepatan (email/password login)
  const localToken = localStorage.getItem('token');
  if (localToken && localToken !== 'null' && localToken !== 'undefined') {
    return localToken;
  }

  // 2. Fallback ke Neon Auth (Google/SSO login)
  try {
    // Gunakan getSession tapi dengan timeout/catch agar tidak menggantung
    const session = await authClient.getSession().catch(() => null);
    const neonToken = session?.data?.token;
    if (neonToken) return neonToken;
  } catch (err) {
    console.warn('[Auth] Neon session check failed:', err);
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
