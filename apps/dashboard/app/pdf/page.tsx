'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * PDF Tools Module Entry Page
 * Redirects to the tenant-specific PDF Tools dashboard if authenticated and tenant is available.
 * Otherwise, redirects to login or dashboard.
 */
export default function PDFToolsModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/login?redirect=/pdf')
      return
    }

    if (tenant?.id) {
      router.push(`/pdf/${tenant.id}/Home/`)
    } else {
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, isLoading, router])

  return <PageLoading message="Loading PDF Tools..." fullScreen={true} />
}
