'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { PageLoading } from '@/components/ui/loading';

/**
 * Root /home page - redirects to /home/[tenantId] if authenticated
 * Otherwise redirects to login
 */
export default function HomePage() {
  const router = useRouter();
  const { tenant, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && tenant?.id) {
      // Redirect to tenant-specific home page
      router.replace(`/home/${tenant.id}`);
    } else if (isAuthenticated && !tenant?.id) {
      // No tenant - redirect to login
      router.replace('/login');
    } else {
      // Not authenticated - redirect to login
      router.replace('/login');
    }
  }, [tenant?.id, isAuthenticated, router]);

  return <PageLoading message="Redirecting..." fullScreen={true} />;
}

