'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function NewContactRedirectPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      router.replace(`/crm/${tenant.id}/Contacts/New`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return <PageLoading message="Redirecting to New Contact..." fullScreen={true} />
}
