'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const tenantId = params.tenantId as string
  const topBarItems = [{ name: 'Notifications', href: `/notifications/${tenantId}` }]
  return (
    <AppShell moduleId="notifications" moduleName="Notifications" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
