'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

/**
 * Redirect from old monolithic route to new decoupled route
 */
export default function PurchaseOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { tenant } = useAuthStore()
  const id = params.id as string

  useEffect(() => {
    if (tenant?.id && id) {
      router.replace(`/finance/${tenant.id}/Purchase-Orders/${id}`)
    } else if (tenant?.id) {
      router.replace(`/finance/${tenant.id}/Purchase-Orders`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, id, router])

  return <PageLoading message="Redirecting to purchase order..." fullScreen={true} />
}
