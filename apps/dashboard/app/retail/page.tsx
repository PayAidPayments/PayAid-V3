'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function RetailModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/retail')
      return
    }
    if (tenant?.id) {
      router.push(`/retail/${tenant.id}/Home/`)
    } else {
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading Retail..." fullScreen={true} />
}
