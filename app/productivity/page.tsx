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
    // Resolve tenant from store or localStorage (store may not have rehydrated yet)
    let effectiveTenantId = tenant?.id
    if (!effectiveTenantId && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored?.trim()) {
          const parsed = JSON.parse(stored)
          effectiveTenantId = parsed?.state?.tenant?.id || null
        }
      } catch {
        // ignore
      }
    }

    const hasToken = typeof window !== 'undefined' && (() => {
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored?.trim()) {
          const parsed = JSON.parse(stored)
          return !!parsed?.state?.token
        }
      } catch {
        // ignore
      }
      return false
    })()

    if (!isAuthenticated && !hasToken) {
      router.push('/login')
      return
    }

    if (effectiveTenantId) {
      router.replace(`/productivity/${effectiveTenantId}/sheets`)
    } else {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading Productivity..." fullScreen={true} />
}
