'use client'

import { useParams, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

// This catch-all route handles tenant-scoped dashboard paths
// It validates the tenant and ensures the URL structure is correct
export default function TenantDashboardCatchAll() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
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

    // IMPORTANT: Don't redirect - preserve the tenant ID in the URL
    // The actual route files at /dashboard/websites, etc. will be matched
    // by Next.js routing, but the URL will keep the tenant ID
    // This is handled by Next.js rewrites in next.config.js
  }, [tenant?.id, tenantIdFromUrl, path, router])

  // This component doesn't render anything - it's just for route matching
  // The actual page components will render
  return null
}
