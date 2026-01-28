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
  const { tenant, isAuthenticated, isLoading, token } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  // Wait for component to mount (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Wait for auth store to rehydrate before making redirect decisions
  useEffect(() => {
    if (!mounted || hasChecked) {
      return
    }

    // Check if Zustand has rehydrated by checking localStorage
    const checkAuth = () => {
      if (typeof window === 'undefined') return

      try {
        // Check if auth storage exists in localStorage
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          const hasToken = !!parsed.state?.token
          const hasUser = !!parsed.state?.user
          const hasTenant = !!parsed.state?.tenant

          // If we have token in storage, wait a moment for Zustand to rehydrate
          if (hasToken) {
            // Give Zustand time to rehydrate (check after a short delay)
            setTimeout(() => {
              const currentState = useAuthStore.getState()
              setHasChecked(true)

              // If still not authenticated but we have token, set authenticated
              if (currentState.token && !currentState.isAuthenticated) {
                useAuthStore.setState({ isAuthenticated: true })
              }
            }, 100)
            return
          }
        }

        // No stored auth - mark as checked immediately
        setHasChecked(true)
      } catch (error) {
        console.error('[CRM] Error checking auth:', error)
        setHasChecked(true) // Assume checked to prevent blocking
      }
    }

    // Check immediately
    checkAuth()

    // Also check after a delay to ensure rehydration completes
    const timeoutId = setTimeout(() => {
      setHasChecked(true)
    }, 500) // Max 500ms wait for rehydration

    return () => clearTimeout(timeoutId)
  }, [mounted, hasChecked])

  // Handle redirects once auth state is determined
  useEffect(() => {
    if (!mounted || !hasChecked) {
      return
    }

    // Get current state (might have changed after rehydration)
    const currentState = useAuthStore.getState()
    const currentIsAuthenticated = currentState.isAuthenticated || (currentState.token !== null)
    const currentTenant = currentState.tenant

    if (!currentIsAuthenticated) {
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
  }, [mounted, hasChecked, isAuthenticated, tenant?.id, token, router])

  return <PageLoading message="Loading CRM..." fullScreen={true} />
}

