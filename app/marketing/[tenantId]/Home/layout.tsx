'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function MarketingHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/marketing/${tenantId}/Home` },
    { name: 'Campaigns', href: `/marketing/${tenantId}/Campaigns` },
    { name: 'Sequences', href: `/marketing/${tenantId}/Sequences` },
    { name: 'Ads', href: `/marketing/${tenantId}/Ads` },
    { name: 'Social Listening', href: `/marketing/${tenantId}/SocialListening` },
    { name: 'Analytics', href: `/marketing/${tenantId}/Analytics` },
    { name: 'Segments', href: `/marketing/${tenantId}/Segments` },
    { name: 'Social', href: `/marketing/${tenantId}/Social-Media` },
  ]

  return (
    <AppShell moduleId="marketing" moduleName="Marketing" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
