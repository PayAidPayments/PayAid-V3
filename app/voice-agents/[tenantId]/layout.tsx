'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'
import { VoiceAgentsSidebar } from '@/components/voice-agent/VoiceAgentsSidebar'

const topBarItemsFor = (tenantId: string) => [
  { name: 'Agents', href: `/voice-agents/${tenantId}/Home` },
  { name: 'Calls', href: `/voice-agents/${tenantId}/Calls` },
  { name: 'Campaigns', href: `/voice-agents/${tenantId}/Campaigns` },
  { name: 'Transcripts', href: `/voice-agents/${tenantId}/Transcripts` },
  { name: 'Analytics', href: `/voice-agents/${tenantId}/Analytics` },
]

export default function VoiceAgentsTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <AppShell
      moduleId="voice-agents"
      moduleName="Voice Agents"
      topBarItems={topBarItemsFor(tenantId)}
      sidebar={<VoiceAgentsSidebar tenantId={tenantId} />}
    >
      {children}
    </AppShell>
  )
}
