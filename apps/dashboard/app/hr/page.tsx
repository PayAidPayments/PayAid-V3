'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * HR Module Entry Page
 * Redirects to the tenant-specific HR Home page if authenticated and tenant is available.
 * Otherwise, redirects to login or dashboard.
 */
export default function HRModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) {
      return // Wait for auth state to load
    }

    if (!isAuthenticated) {
      router.push('/login?redirect=/hr')
      return
    }

    if (tenant?.id) {
      router.push(`/hr/${tenant.id}/Home/`)
    } else {
      // Fallback if tenant is not available, e.g., new user or error
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, isLoading, router])

  return <PageLoading message="Loading HR..." fullScreen={true} />
}

