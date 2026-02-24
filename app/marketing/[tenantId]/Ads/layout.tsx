'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function MarketingAdsLayout({
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
    { name: 'Segments', href: `/marketing/${tenantId}/Segments` },
    { name: 'Email', href: `/marketing/${tenantId}/Email` },
    { name: 'WhatsApp', href: `/marketing/${tenantId}/WhatsApp` },
    { name: 'Social Media', href: `/marketing/${tenantId}/Social-Media` },
    { name: 'Analytics', href: `/marketing/${tenantId}/Analytics` },
  ]

  return (
    <AppShell moduleId="marketing" moduleName="Marketing" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
