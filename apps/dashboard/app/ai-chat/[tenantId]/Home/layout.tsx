'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function AIChatHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/ai-chat/${tenantId}/Home` },
    { name: 'Chats', href: `/ai-chat/${tenantId}/Chats` },
    { name: 'History', href: `/ai-chat/${tenantId}/History` },
  ]

  return (
    <AppShell moduleId="ai-chat" moduleName="AI Chat" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
