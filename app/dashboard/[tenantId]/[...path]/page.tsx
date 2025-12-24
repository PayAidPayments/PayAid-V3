'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

// This catch-all route handles tenant-scoped dashboard paths
// It redirects to the actual route without tenantId (which will be handled by existing routes)
// The middleware ensures tenantId is in the URL, but internally we use the existing route structure
export default function TenantDashboardCatchAll() {
  const params = useParams()
  const router = useRouter()
  const { tenant } = useAuthStore()

  const tenantIdFromUrl = params?.tenantId as string | undefined
  const path = (params?.path as string[]) || []

  useEffect(() => {
    // Verify tenant matches
    if (tenant?.id && tenantIdFromUrl && tenant.id !== tenantIdFromUrl) {
      // Redirect to correct tenant
      const newPath = path.length > 0 ? `/${path.join('/')}` : ''
      router.replace(`/dashboard/${tenant.id}${newPath}`)
      return
    }

    // If no path specified, we're already at the right place (handled by [tenantId]/page.tsx)
    if (path.length === 0) {
      return
    }

    // For paths with segments, redirect to the path without tenantId
    // The middleware will handle adding tenantId back
    const pathWithoutTenant = `/${path.join('/')}`
    router.replace(`/dashboard${pathWithoutTenant}`)
  }, [tenant?.id, tenantIdFromUrl, path, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}
