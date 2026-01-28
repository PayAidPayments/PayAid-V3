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
  const { tenant, isAuthenticated, isLoading, token, fetchUser } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)

  // Wait for component to mount (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Try to fetch user if we have a token but aren't authenticated
  useEffect(() => {
    if (mounted && token && !isAuthenticated && !isLoading) {
      // Try to fetch user to restore auth state
      fetchUser().catch(() => {
        // Silently fail - will redirect to login below
      })
    }
  }, [mounted, token, isAuthenticated, isLoading, fetchUser])

  // Handle redirects once auth state is determined
  useEffect(() => {
    if (!mounted || hasRedirected) {
      return
    }

    // If still loading auth state, wait
    if (isLoading) {
      return
    }

    // If we have a token but aren't authenticated yet, wait a moment for fetchUser to complete
    if (token && !isAuthenticated) {
      // Give fetchUser a chance to complete (max 2 seconds)
      const timeout = setTimeout(() => {
        if (!isAuthenticated) {
          setHasRedirected(true)
          router.push('/login')
        }
      }, 2000)
      return () => clearTimeout(timeout)
    }

    // If not authenticated and no token, redirect to login
    if (!isAuthenticated && !token) {
      setHasRedirected(true)
      router.push('/login')
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
  }, [mounted, isAuthenticated, tenant?.id, isLoading, hasRedirected, router, token])

  // Show loading while checking auth state
  return <PageLoading message="Loading CRM..." fullScreen={true} />
}

