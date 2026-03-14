'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function ComplianceHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/compliance/${tenantId}/Home` },
    { name: 'Compliance', href: `/compliance/${tenantId}/Compliance` },
    { name: 'Legal', href: `/compliance/${tenantId}/Legal` },
  ]

  return (
    <AppShell moduleId="compliance" moduleName="Compliance" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
