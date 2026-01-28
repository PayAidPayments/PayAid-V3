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

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage
    const checkRehydration = () => {
      if (typeof window === 'undefined') {
        setHasChecked(true)
        return
      }

      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          const hasToken = !!parsed.state?.token
          
          if (hasToken) {
            // Wait for Zustand to rehydrate (give it more time)
            setTimeout(() => {
              setHasChecked(true)
            }, 300) // Increased to 300ms for more reliable rehydration
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
          
          // Sync token to cookie for middleware access
          if (tokenFromStorage) {
            const expires = new Date()
            expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
            const isSecure = window.location.protocol === 'https:'
            document.cookie = `token=${tokenFromStorage}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
          }
        }
      } catch (error) {
        console.error('[CRM] Error reading from localStorage:', error)
      }
    }

    // Use Zustand state if available, otherwise fall back to localStorage
    const finalToken = currentState.token || tokenFromStorage
    const finalTenant = currentState.tenant || tenantFromStorage
    // If we have a token, consider user authenticated even if isAuthenticated is false
    // (might be false due to temporary 503 errors from /api/auth/me)
    const finalIsAuthenticated = currentState.isAuthenticated || !!finalToken

    if (!finalToken) {
      // No token at all - definitely not logged in
      router.push('/login?redirect=/crm')
      return
    }

    // If we have a token but no tenant, try to get tenant from token
    if (!finalTenant?.id && finalToken) {
      try {
        // Decode token to get tenantId (don't verify, just decode)
        const parts = finalToken.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          if (payload.tenantId) {
            // We have tenantId from token - redirect to CRM dashboard
            router.push(`/crm/${payload.tenantId}/Home/`)
            return
          }
        }
      } catch (error) {
        console.error('[CRM] Error decoding token:', error)
      }
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


