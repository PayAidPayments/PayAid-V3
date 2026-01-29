'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * CRM Module Entry Point
 * Redirects to the tenant-specific CRM dashboard
 * Format: /crm/[tenantId]/Home/
 * 
 * SIMPLIFIED: Direct check of localStorage and token, no complex rehydration logic
 */
export default function CRMModulePage() {
  const router = useRouter()
  const { tenant, token } = useAuthStore()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) {
      return
    }

    const redirect = () => {
      if (hasRedirected.current) {
        return
      }
      hasRedirected.current = true

      // Check localStorage directly (most reliable)
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
      const currentState = useAuthStore.getState()
      const finalToken = currentState.token || tokenFromStorage
      const finalTenant = currentState.tenant || tenantFromStorage

      console.log('[CRM] Redirect check:', {
        hasToken: !!finalToken,
        hasTenant: !!finalTenant?.id,
        tenantId: finalTenant?.id,
      })

      // If no token, redirect to login
      if (!finalToken) {
        console.log('[CRM] No token found, redirecting to login')
        router.replace('/login?redirect=/crm')
        return
      }

      // If we have tenant ID, redirect to dashboard
      if (finalTenant?.id) {
        console.log(`[CRM] Redirecting to CRM dashboard: /crm/${finalTenant.id}/Home/`)
        router.replace(`/crm/${finalTenant.id}/Home/`)
        return
      }

      // If we have token but no tenant, extract tenantId from token
      if (finalToken) {
        try {
          const parts = finalToken.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            if (payload.tenantId) {
              console.log(`[CRM] Extracted tenantId from token, redirecting to: /crm/${payload.tenantId}/Home/`)
              router.replace(`/crm/${payload.tenantId}/Home/`)
              return
            }
          }
        } catch (error) {
          console.error('[CRM] Error decoding token:', error)
        }
      }

      // Fallback: redirect to home
      console.log('[CRM] No tenant ID found, redirecting to home')
      router.replace('/home')
    }

    // Small delay to allow Zustand to rehydrate, but don't wait too long
    // Only run once - don't depend on tenant/token changes
    const timeoutId = setTimeout(redirect, 200)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [router]) // Only depend on router - don't re-run when tenant/token changes

  return <PageLoading message="Loading CRM..." fullScreen={true} />
}
