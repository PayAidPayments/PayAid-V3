'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Drive Module Entry Page
 * Redirects to the tenant-specific Drive dashboard if authenticated and tenant is available.
 * Otherwise, redirects to login or dashboard.
 */
export default function DriveModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/login?redirect=/drive')
      return
    }

    if (tenant?.id) {
      router.push(`/drive/${tenant.id}/Home/`)
    } else {
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, isLoading, router])

  return <PageLoading message="Loading Drive..." fullScreen={true} />
}
