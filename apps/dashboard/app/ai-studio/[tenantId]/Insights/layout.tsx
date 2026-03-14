'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'

export default function AIStudioInsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Home', href: `/ai-studio/${tenantId}/Home` },
    { name: 'AI Co-founder', href: `/ai-studio/${tenantId}/Cofounder` },
    { name: 'AI Chat', href: `/ai-studio/${tenantId}/Chat` },
    { name: 'AI Insights', href: `/ai-studio/${tenantId}/Insights` },
    { name: 'Websites', href: `/ai-studio/${tenantId}/Websites` },
    { name: 'Logos', href: `/ai-studio/${tenantId}/Logos` },
    { name: 'Knowledge', href: `/ai-studio/${tenantId}/Knowledge` },
  ]

  return (
    <AppShell moduleId="ai-studio" moduleName="AI Studio" topBarItems={topBarItems}>
      {children}
    </AppShell>
  )
}
