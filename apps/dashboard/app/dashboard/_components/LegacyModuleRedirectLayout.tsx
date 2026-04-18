'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

type LegacyModuleRedirectLayoutProps = {
  /** e.g. `/finance/{tenantId}/Accounting` — must contain `{tenantId}` once */
  pathTemplate: string
  loadingMessage: string
}

export default function LegacyModuleRedirectLayout({
  pathTemplate,
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
      router.replace(pathTemplate.replaceAll('{tenantId}', tenant.id))
      return
    }

    router.replace('/dashboard')
  }, [isAuthenticated, isLoading, tenant?.id, router, pathTemplate])

  // Children are intentionally not rendered to enforce decoupled routes.
  return <PageLoading message={loadingMessage} fullScreen={true} />
}

