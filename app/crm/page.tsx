'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * CRM Module Entry Point
 * Redirects to the tenant-specific CRM dashboard
 * Format: /crm/[tenantId]/Home/
 */
export default function CRMModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to login with CRM redirect
      router.push('/login?redirect=/crm')
      return
    }

    if (tenant?.id) {
      // Redirect to tenant-specific CRM dashboard
      router.push(`/crm/${tenant.id}/Home/`)
    } else {
      // No tenant - redirect to home page to set up tenant
      router.push('/home')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading CRM..." fullScreen={true} />
}


