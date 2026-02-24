'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function HRTaxDeclarationsNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/hr/${tenantId}/Home` },
    { name: 'Employees', href: `/hr/${tenantId}/Employees` },
    { name: 'Payroll', href: `/hr/${tenantId}/Payroll` },
    { name: 'Leave', href: `/hr/${tenantId}/Leave` },
    { name: 'Attendance', href: `/hr/${tenantId}/Attendance` },
    { name: 'Hiring', href: `/hr/${tenantId}/Hiring` },
  ]

  return (
    <AppShell moduleId="hr" moduleName="HR" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
