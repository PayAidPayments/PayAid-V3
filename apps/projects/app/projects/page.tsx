'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'

export default function ProjectsModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()
  const didRedirect = useRef(false)

  useEffect(() => {
    if (isLoading || didRedirect.current) return
    didRedirect.current = true

    if (!isAuthenticated) {
      router.push('/login?redirect=/projects')
      return
    }

    const key = getTenantRouteKey(tenant)
    if (!key) {
      router.push('/')
      return
    }

    router.replace(`/projects/${key}/Home`)
  }, [isAuthenticated, isLoading, tenant, router])

  return <PageLoading message="Opening Projects…" fullScreen />
}
