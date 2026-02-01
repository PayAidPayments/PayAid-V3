'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="industry-intelligence"
          moduleName="Industry Intelligence"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
