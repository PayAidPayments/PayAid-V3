'use client'

import { AppShell } from '@/components/modules/AppShell'
import { useTenantId } from '@/lib/utils/get-tenant-id'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CRMChurnLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const tenantId = useTenantId()

  useEffect(() => {
    if (!tenantId) router.replace('/crm')
  }, [tenantId, router])

  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) return null

  const topBarItems = [
    { name: 'Home', href: `/crm/${tenantId}/Home` },
    { name: 'Prospects', href: `/crm/${tenantId}/Leads` },
    { name: 'Agents', href: `/crm/${tenantId}/Agents` },
    { name: 'Churn', href: `/crm/${tenantId}/Churn` },
    { name: 'Metrics', href: `/crm/${tenantId}/Metrics` },
    { name: 'Reports', href: `/crm/${tenantId}/Reports` },
  ]

  return (
    <AppShell moduleId="crm" moduleName="CRM" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
