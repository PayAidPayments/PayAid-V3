'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function FinanceAccountingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/finance/${tenantId}/Home` },
    { name: 'Invoices', href: `/finance/${tenantId}/Invoices` },
    { name: 'Accounting', href: `/finance/${tenantId}/Accounting` },
    { name: 'Purchase Orders', href: `/finance/${tenantId}/Purchase-Orders` },
    { name: 'GST Reports', href: `/finance/${tenantId}/GST` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="finance"
          moduleName="Finance"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
