'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function SlidesTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const topBarItems = [
    { name: 'Home', href: `/slides/${tenantId}/Home` },
    { name: 'Presentations', href: `/slides/${tenantId}/Presentations` },
    { name: 'Templates', href: `/slides/${tenantId}/Templates` },
  ]
  return (
    <AppShell moduleId="slides" moduleName="Slides" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
