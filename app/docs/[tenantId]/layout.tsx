'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function DocsTenantLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const topBarItems = [
    { name: 'Home', href: `/docs/${tenantId}/Home` },
    { name: 'Documents', href: `/docs/${tenantId}/Documents` },
    { name: 'Folders', href: `/docs/${tenantId}/Folders` },
  ]
  return (
    <AppShell moduleId="docs" moduleName="Docs" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
