'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function SalesLandingPagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/sales/${tenantId}/Home` },
    { name: 'Landing Pages', href: `/sales/${tenantId}/Landing-Pages` },
    { name: 'Checkout Pages', href: `/sales/${tenantId}/Checkout-Pages` },
    { name: 'Orders', href: `/sales/${tenantId}/Orders` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="sales"
          moduleName="Sales"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
