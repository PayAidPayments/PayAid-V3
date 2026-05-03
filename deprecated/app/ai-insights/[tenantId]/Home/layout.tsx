'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function AIInsightsHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/ai-insights/${tenantId}/Home` },
    { name: 'Insights', href: `/ai-insights/${tenantId}/Insights` },
    { name: 'Reports', href: `/ai-insights/${tenantId}/Reports` },
  ]

  return (
    <AppShell moduleId="ai-insights" moduleName="AI Insights" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
