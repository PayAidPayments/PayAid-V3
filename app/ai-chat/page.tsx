'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

export default function AIChatPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      router.push(`/ai-studio/${tenant.id}/Chat`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return null
}
