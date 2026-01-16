'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

export default function AIRedirectPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      router.replace(`/ai-studio/${tenant.id}/Home`)
    } else {
      router.replace('/login')
    }
  }, [tenant?.id, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to AI Studio...</p>
      </div>
    </div>
  )
}
