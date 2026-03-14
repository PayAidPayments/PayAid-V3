'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function LogoGeneratorHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/logo-generator/${tenantId}/Home` },
    { name: 'My Logos', href: `/logo-generator/${tenantId}/Logos` },
    { name: 'Templates', href: `/logo-generator/${tenantId}/Templates` },
  ]

  return (
    <AppShell moduleId="logo-generator" moduleName="Logo Generator" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
