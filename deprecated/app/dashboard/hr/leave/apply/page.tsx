'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Redirect from old monolithic route to new decoupled route
 */
export default function ApplyLeavePage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      router.replace(`/hr/${tenant.id}/Leave/Apply`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return <PageLoading message="Redirecting to Apply Leave..." fullScreen={true} />
}
