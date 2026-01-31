'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Analytics Module Entry Point
 * Redirects to the tenant-specific Analytics dashboard
 * Format: /analytics/[tenantId]/Home/
 */
export default function AnalyticsModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) {
      return
    }

    if (!isAuthenticated) {
      // Not logged in - redirect to Analytics-specific login (or main login)
      router.push('/login?redirect=/analytics')
      return
    }

    if (tenant?.id) {
      // Redirect to tenant-specific Analytics dashboard
      router.push(`/analytics/${tenant.id}/Home/`)
    } else {
      // No tenant - redirect to dashboard to set up tenant
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, isLoading, router])

  return <PageLoading message="Loading Analytics..." fullScreen={true} />
}
