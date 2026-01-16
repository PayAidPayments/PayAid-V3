'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function AIStudioInsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/ai-studio/${tenantId}/Home` },
    { name: 'AI Co-founder', href: `/ai-studio/${tenantId}/Cofounder` },
    { name: 'AI Chat', href: `/ai-studio/${tenantId}/Chat` },
    { name: 'AI Insights', href: `/ai-studio/${tenantId}/Insights` },
    { name: 'Websites', href: `/ai-studio/${tenantId}/Websites` },
    { name: 'Logos', href: `/ai-studio/${tenantId}/Logos` },
    { name: 'Knowledge', href: `/ai-studio/${tenantId}/Knowledge` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="ai-studio"
          moduleName="AI Studio"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
