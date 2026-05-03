'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'
import { getMarketingTopBarItems } from '@/lib/marketing/marketing-top-bar-items'

export default function MarketingTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string
  const topBarItems = getMarketingTopBarItems(tenantId)

  return (
    <AppShell moduleId="marketing" moduleName="Marketing" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
