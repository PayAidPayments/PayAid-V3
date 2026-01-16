'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function WebsitePagePreviewRedirectPage() {
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (tenant?.id) {
      const path = window.location.pathname
      const parts = path.split('/')
      const pageIdIndex = parts.findIndex(p => p === 'pages')
      const id = pageIdIndex > 0 ? parts[pageIdIndex - 1] : parts[parts.length - 3]
      const pageId = parts[pageIdIndex + 1]
      router.replace(`/ai-studio/${tenant.id}/Websites/${id}/Pages/${pageId}/Preview`)
    } else {
      router.push('/login')
    }
  }, [tenant?.id, router])

  return <PageLoading message="Redirecting to page preview..." fullScreen={true} />
}
