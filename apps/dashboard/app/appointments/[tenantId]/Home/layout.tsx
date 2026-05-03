'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function AppointmentsHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/appointments/${tenantId}/Home` },
    { name: 'Calendar', href: `/appointments/${tenantId}/Calendar` },
    { name: 'Appointments', href: `/appointments/${tenantId}/Appointments` },
  ]

  return (
    <AppShell moduleId="appointments" moduleName="Appointments" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
