'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function HelpCenterHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/help-center/${tenantId}/Home` },
    { name: 'Articles', href: `/help-center/${tenantId}/Articles` },
    { name: 'Categories', href: `/help-center/${tenantId}/Categories` },
  ]

  return (
    <AppShell moduleId="help-center" moduleName="Help Center" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
