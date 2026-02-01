'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Docs Module Entry Page
 * Redirects to the tenant-specific Docs dashboard if authenticated and tenant is available.
 * Otherwise, redirects to login or dashboard.
 */
export default function DocsModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/login?redirect=/docs')
      return
    }

    if (tenant?.id) {
      router.push(`/docs/${tenant.id}/Home/`)
    } else {
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, isLoading, router])

  return <PageLoading message="Loading Docs..." fullScreen={true} />
}
