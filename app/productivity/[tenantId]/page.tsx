'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

/**
 * Default Productivity landing: redirect to Home dashboard so user can choose Docs, Sheets, Slides, etc.
 */
export default function ProductivityTenantPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.tenantId as string

  useEffect(() => {
    if (tenantId) {
      router.replace(`/productivity/${tenantId}/Home`)
    }
  }, [tenantId, router])

  return null
}
