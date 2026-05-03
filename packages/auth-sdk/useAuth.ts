'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth';

/**
 * React hook for authentication state
 * Works across all PayAid modules with SSO support
 */
export function useAuth() {
  const authStore = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If not authenticated and we have a token, try to fetch user
  useEffect(() => {
    if (mounted && authStore.token && !authStore.isAuthenticated && !authStore.isLoading) {
      authStore.fetchUser().catch(() => {
        // Silently fail - user might not be logged in
      });
    }
  }, [mounted, authStore.token, authStore.isAuthenticated, authStore.isLoading]);

  return {
    user: authStore.user,
    tenant: authStore.tenant,
    isAuthenticated: authStore.isAuthenticated,
    loading: authStore.isLoading || !mounted,
    token: authStore.token,
    logout: authStore.logout,
    getSessionToken: () => authStore.token,
    getUserProfile: () => authStore.user,
  };
}

