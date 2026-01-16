'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function TaskDetailRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const { tenant } = useAuthStore()
  const id = params.id as string

  useEffect(() => {
    if (tenant?.id && id) {
      router.replace(`/projects/${tenant.id}/Tasks/${id}`)
    } else if (tenant?.id) {
      router.replace(`/projects/${tenant.id}/Tasks`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, id, router])

  return <PageLoading message="Redirecting to task..." fullScreen={true} />
}
