'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function InventoryStockMovementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/inventory/${tenantId}/Home` },
    { name: 'Products', href: `/inventory/${tenantId}/Products` },
    { name: 'Warehouses', href: `/inventory/${tenantId}/Warehouses` },
    { name: 'Stock Movements', href: `/inventory/${tenantId}/StockMovements` },
    { name: 'Reports', href: `/inventory/${tenantId}/Reports` },
  ]

  return (
    <AppShell moduleId="inventory" moduleName="Inventory" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
