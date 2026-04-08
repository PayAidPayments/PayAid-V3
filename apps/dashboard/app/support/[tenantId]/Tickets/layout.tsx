'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function SupportTicketsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Chat', href: `/support/${tenantId}/Chat` },
    { name: 'Unibox', href: `/support/${tenantId}/Unibox` },
    { name: 'Tickets', href: `/support/${tenantId}/Tickets` },
    { name: 'Knowledge Base', href: `/support/${tenantId}/KnowledgeBase` },
    { name: 'Settings', href: `/support/${tenantId}/Settings` },
  ]

  return (
    <AppShell moduleId="support" moduleName="Support" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
