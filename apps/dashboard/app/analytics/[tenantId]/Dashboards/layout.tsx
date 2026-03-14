'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function AnalyticsDashboardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/analytics/${tenantId}/Home` },
    { name: 'Reports', href: `/analytics/${tenantId}/Reports` },
    { name: 'Dashboards', href: `/analytics/${tenantId}/Dashboards` },
  ]

  return (
    <AppShell moduleId="analytics" moduleName="Analytics" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
