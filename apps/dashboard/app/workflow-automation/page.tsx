'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Workflow Automation Module Entry Page
 * Redirects to the tenant-specific Workflow Automation page if authenticated and tenant is available.
 * Otherwise, redirects to login or dashboard.
 */
export default function WorkflowAutomationModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // Wait until authentication state is loaded
    if (isLoading) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login?redirect=/workflow-automation')
      return
    }

    if (tenant?.id) {
      // Redirect to tenant-specific Workflow Automation dashboard
      router.push(`/workflow-automation/${tenant.id}/Home/`)
    } else {
      // Fallback if tenant is not available
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, isLoading, router])

  return <PageLoading message="Loading Workflow Automation..." fullScreen={true} />
}
