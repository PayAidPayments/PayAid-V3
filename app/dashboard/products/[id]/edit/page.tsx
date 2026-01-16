'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function EditProductRedirectPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      const path = window.location.pathname
      const parts = path.split('/')
      const id = parts[parts.length - 2] === 'edit' ? parts[parts.length - 3] : parts[parts.length - 1]
      router.replace(`/inventory/${tenant.id}/Products/${id}/Edit`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return <PageLoading message="Redirecting to edit product..." fullScreen={true} />
}
