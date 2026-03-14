'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function MeetTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const topBarItems = [
    { name: 'Home', href: `/meet/${tenantId}/Home` },
    { name: 'Meetings', href: `/meet/${tenantId}/Meetings` },
    { name: 'Recordings', href: `/meet/${tenantId}/Recordings` },
  ]
  return (
    <AppShell moduleId="meet" moduleName="Meet" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
