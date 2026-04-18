'use client'

import { AppShell } from '@/components/modules/AppShell'
import { useParams, useRouter } from 'next/navigation'
import { getCRMTopBarItems } from '@/lib/crm/crm-top-bar-items'
import { useEffect } from 'react'

/**
 * Single layout for entire CRM module. Renders one header/shell so nested routes
 * (Deals/[id], Contacts/[id], etc.) do not show a dual header.
 */
export default function CRMTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''

  useEffect(() => {
    if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
      router.replace('/crm')
    }
  }, [tenantId, router])

  useEffect(() => {
    if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) return
    router.prefetch(`/crm/${tenantId}/Leads/`)
    router.prefetch(`/crm/${tenantId}/Contacts/`)
    router.prefetch(`/crm/${tenantId}/Deals/`)
    router.prefetch(`/crm/${tenantId}/Activities/`)
    router.prefetch(`/crm/${tenantId}/Tasks/`)
    router.prefetch(`/crm/${tenantId}/Automation/`)
    router.prefetch(`/crm/${tenantId}/SalesAutomation/`)
  }, [tenantId, router])

  const topBarItems = tenantId && tenantId.trim() ? getCRMTopBarItems(tenantId) : []

  return (
    <AppShell moduleId="crm" moduleName="CRM" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
