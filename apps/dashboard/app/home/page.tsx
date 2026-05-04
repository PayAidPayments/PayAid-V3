'use client'

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { PageLoading } from '@/components/ui/loading';
import { getAuthFromStorage } from './lib/auth-storage';

/**
 * Root /home page - redirects to /home/[tenantId] if authenticated
 * Otherwise redirects to login.
 * Reads from localStorage so redirect works before Zustand rehydration.
 */
export default function HomePage() {
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;

    const run = () => {
      const { token: tokenFromStorage, tenant: tenantFromStorage } = getAuthFromStorage();

      const currentState = useAuthStore.getState();
      const isAuth = currentState.isAuthenticated || !!tokenFromStorage;
      const resolvedTenant = currentState.tenant ?? tenantFromStorage;
      const tenantPublicId = resolvedTenant?.slug || resolvedTenant?.id;

      if (isAuth && tenantPublicId) {
        window.location.replace(`/home/${tenantPublicId}`);
        return;
      }
      if (isAuth && !tenantPublicId) {
        window.location.replace('/login');
        return;
      }
      window.location.replace('/login');
    };

    run();
  }, []);

  return <PageLoading message="Loading..." fullScreen={true} />;
}

