'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function IndustryIntelligenceHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/industry-intelligence/${tenantId}/Home` },
    { name: 'News', href: `/industry-intelligence/${tenantId}/News` },
    { name: 'Competitors', href: `/industry-intelligence/${tenantId}/Competitors` },
    { name: 'Market Trends', href: `/industry-intelligence/${tenantId}/MarketTrends` },
  ]

  return (
    <AppShell moduleId="industry-intelligence" moduleName="Industry Intelligence" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
