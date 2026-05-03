'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function DriveTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const topBarItems = [
    { name: 'Home', href: `/drive/${tenantId}/Home` },
    { name: 'My Drive', href: `/drive/${tenantId}/MyDrive` },
    { name: 'Shared', href: `/drive/${tenantId}/Shared` },
  ]
  return (
    <AppShell moduleId="drive" moduleName="Drive" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
