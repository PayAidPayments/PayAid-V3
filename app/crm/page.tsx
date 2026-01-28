'use client'

import { useEffect, useState, useRef } from 'react'
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
  const { tenant, isAuthenticated, isLoading, token, fetchUser } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [isFetchingUser, setIsFetchingUser] = useState(false)
  const [rehydrated, setRehydrated] = useState(false)
  const fetchAttemptedRef = useRef(false)

  // Wait for component to mount (client-side only)
  useEffect(() => {
    setMounted(true)
    
    // Check if auth store has rehydrated by checking localStorage
    const checkRehydration = () => {
      if (typeof window === 'undefined') return
      
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          const hasToken = !!parsed.state?.token
          const hasUser = !!parsed.state?.user
          const hasTenant = !!parsed.state?.tenant
          
          // If we have token + user + tenant in storage, mark as rehydrated
          if (hasToken && hasUser && hasTenant) {
            setRehydrated(true)
            // Also ensure store state matches
            const currentState = useAuthStore.getState()
            if (!currentState.isAuthenticated && currentState.token) {
              useAuthStore.setState({ isAuthenticated: true })
            }
            return
          }
          
          // If we have token but not user/tenant, still mark as rehydrated
          // (fetchUser will populate user/tenant)
          if (hasToken) {
            setRehydrated(true)
            return
          }
        }
        
        // No stored auth data - mark as rehydrated anyway
        setRehydrated(true)
      } catch (error) {
        console.error('[CRM] Error checking rehydration:', error)
        setRehydrated(true) // Assume rehydrated to prevent blocking
      }
    }
    
    // Check immediately and after a small delay
    checkRehydration()
    const timeoutId = setTimeout(checkRehydration, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])

  // Try to fetch user if we have a token but aren't authenticated
  useEffect(() => {
    if (!mounted || !rehydrated || fetchAttemptedRef.current) {
      return
    }

    // If we have a token but aren't authenticated, try to fetch user
    if (token && !isAuthenticated && !isLoading && !isFetchingUser) {
      fetchAttemptedRef.current = true
      setIsFetchingUser(true)
      
      fetchUser()
        .then(() => {
          setIsFetchingUser(false)
        })
        .catch((error) => {
          console.error('[CRM] Failed to fetch user:', error)
          setIsFetchingUser(false)
          // If fetchUser fails with 401, token is invalid - clear it
          if (error?.message?.includes('401') || error?.message?.includes('unauthorized') || error?.message?.includes('Invalid or expired token')) {
            console.warn('[CRM] Token is invalid - clearing auth state')
            useAuthStore.getState().logout()
          }
        })
    }
  }, [mounted, rehydrated, token, isAuthenticated, isLoading, isFetchingUser, fetchUser])

  // Handle redirects once auth state is determined
  useEffect(() => {
    if (!mounted || !rehydrated || hasRedirected) {
      return
    }

    // Wait for auth state to stabilize
    if (isLoading || isFetchingUser) {
      return
    }

    // If we have a token but aren't authenticated yet, wait a bit longer for fetchUser
    if (token && !isAuthenticated && fetchAttemptedRef.current) {
      // Already attempted fetchUser - if still not authenticated, token is invalid
      // Clear invalid token and redirect to login
      console.warn('[CRM] Token exists but fetchUser failed - redirecting to login')
      useAuthStore.getState().logout()
      setHasRedirected(true)
      router.push('/login?redirect=/crm')
      return
    }

    // If we have a token but haven't attempted fetchUser yet, wait a moment
    if (token && !isAuthenticated && !fetchAttemptedRef.current) {
      // Give it a moment for the effect above to trigger fetchUser
      const timeout = setTimeout(() => {
        if (!isAuthenticated && !isFetchingUser && !hasRedirected) {
          console.warn('[CRM] Token exists but fetchUser did not complete - redirecting to login')
          setHasRedirected(true)
          router.push('/login?redirect=/crm')
        }
      }, 3000) // Increased to 3 seconds to give fetchUser more time
      return () => clearTimeout(timeout)
    }

    // If not authenticated and no token, redirect to login
    if (!isAuthenticated && !token) {
      setHasRedirected(true)
      router.push('/login?redirect=/crm')
      return
    }

    // If authenticated, check for tenant
    if (isAuthenticated && tenant?.id && typeof tenant.id === 'string' && tenant.id.trim()) {
      setHasRedirected(true)
      router.push(`/crm/${tenant.id}/Home/`)
    } else if (isAuthenticated) {
      // Authenticated but no tenant - redirect to home page to set up tenant
      setHasRedirected(true)
      router.push('/home')
    }
  }, [mounted, rehydrated, isAuthenticated, tenant?.id, isLoading, hasRedirected, router, token, isFetchingUser])

  // Show loading while checking auth state
  return <PageLoading message="Loading CRM..." fullScreen={true} />
}

