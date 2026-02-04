'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="analytics"
          moduleName="Analytics"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
