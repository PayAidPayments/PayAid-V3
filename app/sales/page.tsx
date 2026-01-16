'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Sales Module Entry Point
 * Redirects to the tenant-specific Sales dashboard
 * Format: /sales/[tenantId]/Home/
 */
export default function SalesModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to Sales-specific login
      router.push('/sales/login')
      return
    }

    if (tenant?.id) {
      // Redirect to tenant-specific Sales dashboard
      router.push(`/sales/${tenant.id}/Home/`)
    } else {
      // No tenant - redirect to dashboard to set up tenant
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading Sales..." fullScreen={true} />
}

