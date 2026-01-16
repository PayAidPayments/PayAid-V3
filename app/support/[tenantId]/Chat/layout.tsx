'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function SupportChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Chat', href: `/support/${tenantId}/Chat` },
    { name: 'Tickets', href: `/support/${tenantId}/Tickets` },
    { name: 'Knowledge Base', href: `/support/${tenantId}/KnowledgeBase` },
    { name: 'Settings', href: `/support/${tenantId}/Settings` },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="support"
          moduleName="Support"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
