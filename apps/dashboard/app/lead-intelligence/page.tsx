'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageLoading } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'

export default function LeadIntelligenceModuleEntryPage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/login?redirect=/lead-intelligence')
      return
    }
    const key = getTenantRouteKey(tenant)
    if (key) {
      router.replace(`/lead-intelligence/${key}/Home`)
      return
    }
    router.replace('/dashboard')
  }, [isAuthenticated, isLoading, router, tenant])

  return <PageLoading message="Loading Lead Intelligence..." fullScreen={true} />
}
