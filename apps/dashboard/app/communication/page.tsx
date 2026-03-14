'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function CommunicationModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/communication')
      return
    }
    if (tenant?.id) {
      router.push(`/communication/${tenant.id}/Home/`)
    } else {
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, router])

  return <PageLoading message="Loading Communication..." fullScreen={true} />
}
