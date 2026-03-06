'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Lightweight redirect: /tenant-home/[tenantId] → /home/[tenantId]
 * Avoids duplicating the heavy home chunk and prevents load timeouts.
 */
export default function TenantHomeRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string

  useEffect(() => {
    if (tenantId) {
      router.replace(`/home/${tenantId}`)
    }
  }, [tenantId, router])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-gray-400">Redirecting…</p>
      </div>
    </div>
  )
}
