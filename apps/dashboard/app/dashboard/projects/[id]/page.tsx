'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function ProjectDetailRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const { tenant } = useAuthStore()
  const id = params.id as string

  useEffect(() => {
    if (tenant?.id && id) {
      router.replace(`/projects/${tenant.id}/Projects/${id}`)
    } else if (tenant?.id) {
      router.replace(`/projects/${tenant.id}/Projects`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, id, router])

  return <PageLoading message="Redirecting to project..." fullScreen={true} />
}
