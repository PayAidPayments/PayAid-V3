'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function NewCampaignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/marketing/${tenantId}/Home` },
    { name: 'Campaigns', href: `/marketing/${tenantId}/Campaigns` },
    { name: 'Analytics', href: `/marketing/${tenantId}/Analytics` },
    { name: 'Segments', href: `/marketing/${tenantId}/Segments` },
    { name: 'Social', href: `/marketing/${tenantId}/Social-Media` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="marketing"
          moduleName="Marketing"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
