'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function SpreadsheetTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/spreadsheet/${tenantId}/Home` },
    { name: 'Spreadsheets', href: `/spreadsheet/${tenantId}/Spreadsheets` },
    { name: 'Templates', href: `/spreadsheet/${tenantId}/Templates` },
  ]

  return (
    <AppShell moduleId="spreadsheet" moduleName="Spreadsheet" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
