'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Redirect to single-flow Marketing Studio.
 * Legacy Create-Post flow is consolidated into Studio Step 2–4.
 */
export default function CreatePostRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string

  useEffect(() => {
    if (tenantId) router.replace(`/marketing/${tenantId}/Studio?legacyRedirect=1`)
  }, [tenantId, router])

  return <p className="p-4 text-slate-500">Redirecting to Studio…</p>
}
