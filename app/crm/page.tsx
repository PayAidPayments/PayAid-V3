'use client'

import { useEffect, useState } from 'react'
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
  const { tenant, isAuthenticated, token } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) {
      return
    }

    // Wait a moment for Zustand to rehydrate if we have a token
    const checkAuth = () => {
      // Get current state (might have changed after rehydration)
      const currentState = useAuthStore.getState()
      const hasToken = currentState.token || (typeof window !== 'undefined' && localStorage.getItem('auth-storage'))
      const currentIsAuthenticated = currentState.isAuthenticated || !!hasToken
      const currentTenant = currentState.tenant

      if (!currentIsAuthenticated || !hasToken) {
        // Not logged in - redirect to login with CRM redirect
        router.push('/login?redirect=/crm')
        return
      }

      if (currentTenant?.id) {
        // Redirect to tenant-specific CRM dashboard
        router.push(`/crm/${currentTenant.id}/Home/`)
      } else {
        // No tenant - redirect to home page to set up tenant
        router.push('/home')
      }
    }

    // If we have a token, wait a moment for rehydration
    if (token || (typeof window !== 'undefined' && localStorage.getItem('auth-storage'))) {
      setTimeout(checkAuth, 100)
    } else {
      checkAuth()
    }
  }, [mounted, isAuthenticated, tenant?.id, token, router])

  return <PageLoading message="Loading CRM..." fullScreen={true} />
}


