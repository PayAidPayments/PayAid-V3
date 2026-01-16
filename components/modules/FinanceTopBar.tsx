'use client'

import { ModuleTopBar } from './ModuleTopBar'

export function FinanceTopBar() {
  return (
    <ModuleTopBar
      moduleId="finance"
      moduleName="Finance"
      items={[
        { name: 'Home', href: '/dashboard/finance', icon: '🏠' },
        { name: 'Invoices', href: '/dashboard/invoices', icon: '🧾' },
        { name: 'Accounting', href: '/dashboard/accounting', icon: '📈' },
        { name: 'Purchase Orders', href: '/dashboard/finance/purchase-orders', icon: '📝' },
        { name: 'GST', href: '/dashboard/gst', icon: '📋' },
        { name: 'Reports', href: '/dashboard/finance/reports', icon: '📊' },
      ]}
    />
  )
}

