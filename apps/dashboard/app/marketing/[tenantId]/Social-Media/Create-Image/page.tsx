'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Redirect to single-flow Marketing Studio.
 * Legacy Create-Image flow is consolidated into Studio Step 2 (Content & Media).
 */
export default function CreateImageRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string

  useEffect(() => {
    if (tenantId) router.replace(`/marketing/${tenantId}/Studio?legacyRedirect=1`)
  }, [tenantId, router])

  return <p className="p-4 text-slate-500">Redirecting to Studio…</p>
}
