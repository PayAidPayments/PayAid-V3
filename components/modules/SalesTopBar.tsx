'use client'

import { ModuleTopBar } from './ModuleTopBar'

export function SalesTopBar() {
  return (
    <ModuleTopBar
      moduleId="sales"
      moduleName="Sales"
      items={[
        { name: 'Home', href: '/dashboard/sales', icon: '🏠' },
        { name: 'Landing Pages', href: '/dashboard/landing-pages', icon: '📄' },
        { name: 'Checkout Pages', href: '/dashboard/checkout-pages', icon: '💳' },
        { name: 'Orders', href: '/dashboard/orders', icon: '🛒' },
        { name: 'Quotes', href: '/dashboard/sales/quotes', icon: '📝' },
        { name: 'Reports', href: '/dashboard/sales/reports', icon: '📊' },
      ]}
    />
  )
}

