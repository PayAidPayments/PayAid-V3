'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function RestaurantModulePage() {
  const router = useRouter()
  const { tenant, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login?redirect=/restaurant')
      return
    }
    if (tenant?.id) {
      router.push(`/restaurant/${tenant.id}/Home/`)
    } else {
      router.push('/dashboard')
    }
  }, [isAuthenticated, tenant?.id, isLoading, router])

  return <PageLoading message="Loading Restaurant..." fullScreen={true} />
}
