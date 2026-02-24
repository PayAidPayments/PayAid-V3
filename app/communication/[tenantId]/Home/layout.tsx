'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function CommunicationHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/communication/${tenantId}/Home` },
    { name: 'Messages', href: `/communication/${tenantId}/Messages` },
    { name: 'Channels', href: `/communication/${tenantId}/Channels` },
  ]

  return (
    <AppShell moduleId="communication" moduleName="Communication" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
