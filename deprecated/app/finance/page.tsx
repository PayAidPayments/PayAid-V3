'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Finance Module Entry Point
 * Redirects to the tenant-specific Finance dashboard
 * Format: /finance/[tenantId]/Home/
 */
export default function FinanceModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to Finance-specific login
      router.push('/finance/login')
      return
    }

    if (tenant?.id) {
      // Redirect to tenant-specific Finance dashboard
      router.push(`/finance/${tenant.id}/Home/`)
    } else {
      // No tenant - redirect to dashboard to set up tenant
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading Finance..." fullScreen={true} />
}

