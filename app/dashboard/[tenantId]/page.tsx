'use client'

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'

// This page handles /dashboard/[tenantId] routes
// It validates the tenant and redirects to the main dashboard
export default function TenantDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { tenant } = useAuthStore()

  const tenantIdFromUrl = params?.tenantId as string | undefined

  useEffect(() => {
    // Verify tenant matches
    if (tenant?.id && tenantIdFromUrl && tenant.id !== tenantIdFromUrl) {
      // Redirect to correct tenant
      router.replace(`/dashboard/${tenant.id}`)
      return
    }
    
    // Redirect to main dashboard stats page
    if (tenantIdFromUrl) {
      router.replace(`/dashboard/${tenantIdFromUrl}/stats`)
    }
  }, [tenant?.id, tenantIdFromUrl, router])

  // Show loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Loading dashboard...</p>
      </div>
    </div>
  )
}
