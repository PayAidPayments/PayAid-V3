'use client'

import { useParams } from 'next/navigation'
import { UniversalModuleLayout } from '@/components/modules/UniversalModuleLayout'

export default function FinanceHomeLayout({
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
    <UniversalModuleLayout
      moduleId="finance"
      moduleName="Finance"
      topBarItems={topBarItems}
    >
      {children}
    </UniversalModuleLayout>
  )
}
