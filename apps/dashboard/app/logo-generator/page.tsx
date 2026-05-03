'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function LogoGeneratorModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login?redirect=/logo-generator')
      return
    }
    // Avoid bouncing users to Home while auth store is still hydrating tenant.
    if (!tenant?.id) return
    if (tenant?.id) {
      router.push(`/logo-generator/${tenant.id}/Home/`)
    }
  }, [isAuthenticated, tenant?.id, isLoading, router])

  return <PageLoading message="Loading Logo Generator..." fullScreen={true} />
}
