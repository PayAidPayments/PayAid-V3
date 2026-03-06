'use client'

import { useParams } from 'next/navigation'
import { UniversalModuleLayout } from '@/components/modules/UniversalModuleLayout'
import { getFinanceTopBarItems } from '@/lib/finance/finance-top-bar-items'

export default function FinanceTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string
  const topBarItems = getFinanceTopBarItems(tenantId)

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
