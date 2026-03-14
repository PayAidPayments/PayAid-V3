'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'
import { getInventoryTopBarItems } from '@/lib/inventory/inventory-top-bar-items'

export default function InventoryTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string
  const topBarItems = getInventoryTopBarItems(tenantId)

  return (
    <AppShell moduleId="inventory" moduleName="Inventory" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
