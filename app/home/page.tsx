'use client'

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { PageLoading } from '@/components/ui/loading';

/**
 * Root /home page - redirects to /home/[tenantId] if authenticated
 * Otherwise redirects to login.
 * Reads from localStorage so redirect works before Zustand rehydration.
 */
export default function HomePage() {
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;

    const run = () => {
      let tokenFromStorage: string | null = null;
      let tenantFromStorage: { id?: string } | null = null;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('auth-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            tokenFromStorage = parsed.state?.token ?? null;
            tenantFromStorage = parsed.state?.tenant ?? null;
          }
        } catch {
          // ignore
        }
      }

      const currentState = useAuthStore.getState();
      const isAuth = currentState.isAuthenticated || !!tokenFromStorage;
      const resolvedTenant = currentState.tenant ?? tenantFromStorage;
      const tenantId = resolvedTenant?.id;

      if (isAuth && tenantId) {
        window.location.replace(`/home/${tenantId}`);
        return;
      }
      if (isAuth && !tenantId) {
        window.location.replace('/login');
        return;
      }
      window.location.replace('/login');
    };

    run();
  }, [router]);

  return <PageLoading message="Loading..." fullScreen={true} />;
}

