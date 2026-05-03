'use client'

import { ModuleTopBar } from './ModuleTopBar'

export function InventoryTopBar() {
  return (
    <ModuleTopBar
      moduleId="inventory"
      moduleName="Inventory"
      items={[
        { name: 'Home', href: '/dashboard/inventory', icon: '🏠' },
        { name: 'Products', href: '/dashboard/products', icon: '📦' },
        { name: 'Stock', href: '/dashboard/inventory/stock', icon: '📊' },
        { name: 'Warehouses', href: '/dashboard/inventory/warehouses', icon: '🏭' },
        { name: 'Transfers', href: '/dashboard/inventory/transfers', icon: '🚚' },
        { name: 'Reports', href: '/dashboard/inventory/reports', icon: '📊' },
      ]}
    />
  )
}

