'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function CreatePostRedirectPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      router.replace(`/marketing/${tenant.id}/Social-Media/Create-Post`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return <PageLoading message="Redirecting to Create Post..." fullScreen={true} />
}
