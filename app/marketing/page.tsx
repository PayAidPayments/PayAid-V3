'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

/**
 * Marketing Module Entry Point
 * Redirects to the tenant-specific Marketing dashboard
 * Format: /marketing/[tenantId]/Home/
 */
export default function MarketingModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to Marketing-specific login (or main login)
      router.push('/login?redirect=/marketing')
      return
    }

    if (tenant?.id) {
      // Redirect to tenant-specific Marketing dashboard
      router.push(`/marketing/${tenant.id}/Home/`)
    } else {
      // No tenant - redirect to dashboard to set up tenant
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Marketing...</p>
      </div>
    </div>
  )
}

