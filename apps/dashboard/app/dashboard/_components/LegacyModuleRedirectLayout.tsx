'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

type LegacyModuleRedirectLayoutProps = {
  target: (tenantId: string) => string
  loadingMessage: string
}

export default function LegacyModuleRedirectLayout({
  target,
  loadingMessage,
}: LegacyModuleRedirectLayoutProps) {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (tenant?.id) {
      router.replace(target(tenant.id))
      return
    }

    router.replace('/dashboard')
  }, [isAuthenticated, isLoading, tenant?.id, router, target])

  // Children are intentionally not rendered to enforce decoupled routes.
  return <PageLoading message={loadingMessage} fullScreen={true} />
}

