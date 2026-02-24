'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function ContractsHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/contracts/${tenantId}/Home` },
    { name: 'Contracts', href: `/contracts/${tenantId}/Contracts` },
    { name: 'Templates', href: `/contracts/${tenantId}/Templates` },
  ]

  return (
    <AppShell moduleId="contracts" moduleName="Contracts" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
