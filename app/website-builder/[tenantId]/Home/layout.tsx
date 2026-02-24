'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function WebsiteBuilderHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/website-builder/${tenantId}/Home` },
    { name: 'Websites', href: `/website-builder/${tenantId}/Websites` },
    { name: 'Templates', href: `/website-builder/${tenantId}/Templates` },
  ]

  return (
    <AppShell moduleId="website-builder" moduleName="Website Builder" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
