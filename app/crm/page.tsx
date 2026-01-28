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
  const [hasChecked, setHasChecked] = useState(false)

  // Wait for Zustand to rehydrate from localStorage before checking auth
  useEffect(() => {
    // Check if auth storage exists in localStorage
    if (typeof window === 'undefined') return

    const checkRehydration = () => {
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          const hasToken = !!parsed.state?.token
          
          // If we have token in storage, wait a moment for Zustand to rehydrate
          if (hasToken) {
            // Give Zustand time to rehydrate (check after a short delay)
            setTimeout(() => {
              setHasChecked(true)
            }, 200) // 200ms should be enough for rehydration
            return
          }
        }
        
        // No stored auth - mark as checked immediately
        setHasChecked(true)
      } catch (error) {
        console.error('[CRM] Error checking rehydration:', error)
        setHasChecked(true) // Assume checked to prevent blocking
      }
    }

    checkRehydration()

    // Fallback timeout - always mark as checked after 1 second max
    const timeoutId = setTimeout(() => {
      setHasChecked(true)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  // Handle redirects once rehydration is checked
  useEffect(() => {
    if (!hasChecked) {
      return
    }

    // Get current state after rehydration
    const currentState = useAuthStore.getState()
    
    // Also check localStorage directly as fallback
    let tokenFromStorage: string | null = null
    let tenantFromStorage: any = null
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          tokenFromStorage = parsed.state?.token || null
          tenantFromStorage = parsed.state?.tenant || null
        }
      } catch (error) {
        console.error('[CRM] Error reading from localStorage:', error)
      }
    }

    // Use Zustand state if available, otherwise fall back to localStorage
    const finalToken = currentState.token || tokenFromStorage
    const finalTenant = currentState.tenant || tenantFromStorage
    const finalIsAuthenticated = currentState.isAuthenticated || !!finalToken

    if (!finalIsAuthenticated || !finalToken) {
      // Not logged in - redirect to login with CRM redirect
      router.push('/login?redirect=/crm')
      return
    }

    if (finalTenant?.id) {
      // Redirect to tenant-specific CRM dashboard
      router.push(`/crm/${finalTenant.id}/Home/`)
    } else {
      // No tenant - redirect to home page to set up tenant
      router.push('/home')
    }
  }, [hasChecked, isAuthenticated, tenant?.id, token, router])

  return <PageLoading message="Loading CRM..." fullScreen={true} />
}


