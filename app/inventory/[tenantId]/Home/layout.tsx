'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function InventoryHomeLayout({
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="inventory"
          moduleName="Inventory"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
