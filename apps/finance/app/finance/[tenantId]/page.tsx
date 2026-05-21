'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function FinanceTenantIndexPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''

  useEffect(() => {
    if (tenantId) router.replace(`/finance/${tenantId}/Home`)
  }, [tenantId, router])

  return null
}
