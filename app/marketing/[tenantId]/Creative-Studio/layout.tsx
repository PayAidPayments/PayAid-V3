'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function CreativeStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/marketing/${tenantId}/Home` },
    { name: 'Campaigns', href: `/marketing/${tenantId}/Campaigns` },
    { name: 'Ads', href: `/marketing/${tenantId}/Ads` },
    { name: 'Creative Studio', href: `/marketing/${tenantId}/Creative-Studio` },
    { name: 'Product Studio', href: `/marketing/${tenantId}/Creative-Studio/Product-Studio` },
    { name: 'Model Studio', href: `/marketing/${tenantId}/Creative-Studio/Model-Studio` },
    { name: 'UGC Video Ads', href: `/marketing/${tenantId}/AI-Influencer` },
    { name: 'Image Ads', href: `/marketing/${tenantId}/Creative-Studio/Image-Ads` },
    { name: 'Ad Insights', href: `/marketing/${tenantId}/Creative-Studio/Ad-Insights` },
    { name: 'Social', href: `/marketing/${tenantId}/Social-Media` },
    { name: 'Analytics', href: `/marketing/${tenantId}/Analytics` },
  ]

  return (
    <AppShell moduleId="marketing" moduleName="Marketing" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
