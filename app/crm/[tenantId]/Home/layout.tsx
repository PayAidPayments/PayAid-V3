'use client'

import { AppShell } from '@/components/modules/AppShell'
import { useParams } from 'next/navigation'
import { getCRMTopBarItems } from '@/lib/crm/crm-top-bar-items'

export default function CRMHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantIdParam = params?.tenantId
  const tenantIdFromParams = Array.isArray(tenantIdParam)
    ? (tenantIdParam[0] || null)
    : (tenantIdParam as string | undefined || null)
  const tenantId = (tenantIdFromParams && typeof tenantIdFromParams === 'string' && tenantIdFromParams.trim())
    ? tenantIdFromParams
    : undefined

  if (!tenantIdFromParams || typeof tenantIdFromParams !== 'string' || !tenantIdFromParams.trim()) {
    return null
  }

  const topBarItems = getCRMTopBarItems(tenantId)

  return (
    <AppShell moduleId="crm" moduleName="CRM" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
