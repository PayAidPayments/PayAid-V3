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
      fetchUser().catch(() => {
        // Silently fail - will redirect to login below
      })
    }
  }, [mounted, token, isAuthenticated, isLoading, fetchUser])

  // Handle redirects once auth state is determined
  useEffect(() => {
    if (!mounted || isLoading || hasRedirected) {
      return
    }

    // If not authenticated after checking, redirect to login
    if (!isAuthenticated) {
      setHasRedirected(true)
      router.push('/crm/login')
      return
    }

    // If authenticated, check for tenant
    if (tenant?.id && typeof tenant.id === 'string' && tenant.id.trim()) {
      setHasRedirected(true)
      router.push(`/crm/${tenant.id}/Home/`)
    } else {
      // No tenant - redirect to home page to set up tenant
      setHasRedirected(true)
      router.push('/home')
    }
  }, [mounted, isAuthenticated, tenant?.id, isLoading, hasRedirected, router])

  // Show loading while checking auth state
  return <PageLoading message="Loading CRM..." fullScreen={true} />
}

