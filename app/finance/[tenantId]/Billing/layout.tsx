'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function FinanceBillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/finance/${tenantId}/Home` },
    { name: 'Invoices', href: `/finance/${tenantId}/Invoices` },
    { name: 'Accounting', href: `/finance/${tenantId}/Accounting` },
    { name: 'Purchase Orders', href: `/finance/${tenantId}/Purchase-Orders` },
    { name: 'GST Reports', href: `/finance/${tenantId}/GST` },
  ]

  return (
    <AppShell moduleId="finance" moduleName="Finance" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
