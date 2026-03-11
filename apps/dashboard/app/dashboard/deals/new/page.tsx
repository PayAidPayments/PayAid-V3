'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function NewDealRedirectPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      const searchParams = new URLSearchParams(window.location.search)
      const contactId = searchParams.get('contactId')
      const query = contactId ? `?contactId=${contactId}` : ''
      router.replace(`/crm/${tenant.id}/Deals/New${query}`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return <PageLoading message="Redirecting to New Deal..." fullScreen={true} />
}
