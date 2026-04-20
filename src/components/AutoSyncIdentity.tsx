import { useEffect } from 'react';
import { authClient } from '../lib/stackAuth';
import authService from '../lib/authService';
import { authAPI } from '../lib/api';

/**
 * AutoSyncIdentity component
 * 
 * This component runs in the background and checks if the current local user 
 * needs to be linked with a Neon Auth identity.
 * 
 * Condition:
 * 1. User is logged in locally.
 * 2. User does NOT have a neon_user_id in their local profile.
 * 3. A Neon Auth session is detected (e.g., after Google Login or email verification).
 */
export default function AutoSyncIdentity() {
  useEffect(() => {
    const syncIdentity = async () => {
      const localUser = authService.getUser();
      // If the local user already exists AND has a neon_user_id, no need to sync
      if (localUser && localUser.neon_user_id) {
        return;
      }

      try {
        // Check if there is an active Neon Auth session
        const session = await authClient.getSession();
        const neonToken = session?.data?.token;

        if (neonToken) {
          console.log('[AutoSync] Neon session detected. Attempting to link identity...');
          
          await authAPI.syncNeon(neonToken);
          console.log('[AutoSync] Identity linked successfully!');
            
          // Refresh user profile locally to get the new neon_user_id
          await authService.me();
        }
      } catch (error) {
        // Silent fail to not disturb user experience
        console.error('[AutoSync] Error during identity sync:', error);
      }
    };

    // Run check on mount and occasionally (in case session changes)
    syncIdentity();
    
    // Check every 5 minutes in case they login via another tab
    const interval = setInterval(syncIdentity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null; // Renderless component
}
