'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const tenantId = useParams().tenantId as string
  const topBarItems = [{ name: 'Marketplace', href: `/marketplace/${tenantId}` }]

  return (
    <AppShell moduleId="marketplace" moduleName="Marketplace" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
