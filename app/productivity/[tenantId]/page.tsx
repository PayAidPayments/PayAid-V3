'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

/**
 * Default Productivity landing: redirect to PayAid Sheets
 */
export default function ProductivityTenantPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.tenantId as string

  useEffect(() => {
    if (tenantId) {
      router.replace(`/productivity/${tenantId}/sheets`)
    }
  }, [tenantId, router])

  return null
}
