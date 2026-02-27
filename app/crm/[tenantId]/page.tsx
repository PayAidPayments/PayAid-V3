'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * CRM tenant root should land on the CRM dashboard.
 * This also ensures production users always see the AI Command Center on Home.
 */
export default function CRMTenantIndexPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''

  useEffect(() => {
    if (tenantId) router.replace(`/crm/${tenantId}/Home`)
  }, [tenantId, router])

  return null
}

