'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function MarketingSocialListeningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/marketing/${tenantId}/Home` },
    { name: 'Campaigns', href: `/marketing/${tenantId}/Campaigns` },
    { name: 'Sequences', href: `/marketing/${tenantId}/Sequences` },
    { name: 'Ads', href: `/marketing/${tenantId}/Ads` },
    { name: 'Social Listening', href: `/marketing/${tenantId}/SocialListening` },
    { name: 'Segments', href: `/marketing/${tenantId}/Segments` },
    { name: 'Email', href: `/marketing/${tenantId}/Email` },
    { name: 'WhatsApp', href: `/marketing/${tenantId}/WhatsApp` },
    { name: 'Social Media', href: `/marketing/${tenantId}/Social-Media` },
    { name: 'Analytics', href: `/marketing/${tenantId}/Analytics` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="marketing"
          moduleName="Marketing"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
