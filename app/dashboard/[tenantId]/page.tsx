'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import DashboardPage from '../page'

// This page handles /dashboard/[tenantId] routes
// It validates the tenant and renders the dashboard
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
  }, [tenant?.id, tenantIdFromUrl, router])

  // Render the actual dashboard page
  return <DashboardPage />
}
