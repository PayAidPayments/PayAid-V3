'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/sales/${tenantId}/Home` },
    { name: 'Landing Pages', href: `/sales/${tenantId}/Landing-Pages` },
    { name: 'Checkout Pages', href: `/sales/${tenantId}/Checkout-Pages` },
    { name: 'Orders', href: `/sales/${tenantId}/Orders` },
  ]

  return (
    <AppShell moduleId="sales" moduleName="Sales" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
