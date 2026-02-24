'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'
import { getCRMTopBarItems } from '@/lib/crm/crm-top-bar-items'

export default function EditDealLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string
  const topBarItems = getCRMTopBarItems(tenantId)

  return (
    <AppShell moduleId="crm" moduleName="CRM" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
