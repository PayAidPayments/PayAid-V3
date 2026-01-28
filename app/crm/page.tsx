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
  const fetchAttemptedRef = useRef(false)

  // Wait for component to mount (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Try to fetch user if we have a token but aren't authenticated
  useEffect(() => {
    if (!mounted || fetchAttemptedRef.current) {
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
          // If fetchUser fails, token is likely invalid - clear it
          if (error?.message?.includes('401') || error?.message?.includes('unauthorized')) {
            useAuthStore.getState().logout()
          }
        })
    }
  }, [mounted, token, isAuthenticated, isLoading, isFetchingUser, fetchUser])

  // Handle redirects once auth state is determined
  useEffect(() => {
    if (!mounted || hasRedirected) {
      return
    }

    // Wait for auth state to stabilize
    // Give it time for:
    // 1. Zustand rehydration (localStorage)
    // 2. fetchUser to complete if token exists
    if (isLoading || isFetchingUser) {
      return
    }

    // If we have a token but aren't authenticated yet, wait a bit longer for fetchUser
    if (token && !isAuthenticated && fetchAttemptedRef.current) {
      // Already attempted fetchUser - if still not authenticated, token is invalid
      setHasRedirected(true)
      router.push('/login?redirect=/crm')
      return
    }

    // If we have a token but haven't attempted fetchUser yet, wait a moment
    if (token && !isAuthenticated && !fetchAttemptedRef.current) {
      // Give it a moment for the effect above to trigger fetchUser
      const timeout = setTimeout(() => {
        if (!isAuthenticated && !isFetchingUser) {
          setHasRedirected(true)
          router.push('/login?redirect=/crm')
        }
      }, 1000)
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
  }, [mounted, isAuthenticated, tenant?.id, isLoading, hasRedirected, router, token, isFetchingUser])

  // Show loading while checking auth state
  return <PageLoading message="Loading CRM..." fullScreen={true} />
}

