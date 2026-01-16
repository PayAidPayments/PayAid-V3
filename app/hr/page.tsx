'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * HR Module Entry Point
 * Redirects to the tenant-specific HR dashboard
 * Format: /hr/[tenantId]/Home/
 */
export default function HRModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to HR-specific login (or main login)
      router.push('/login?redirect=/hr')
      return
    }

    if (tenant?.id) {
      // Redirect to tenant-specific HR dashboard
      router.push(`/hr/${tenant.id}/Home/`)
    } else {
      // No tenant - redirect to dashboard to set up tenant
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading HR..." fullScreen={true} />
}

