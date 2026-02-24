'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Productivity Module Entry Point
 * Redirects to tenant-specific Productivity with default tool (Sheets)
 */
export default function ProductivityModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (tenant?.id) {
      router.push(`/productivity/${tenant.id}/sheets`)
    } else {
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading Productivity..." fullScreen={true} />
}
