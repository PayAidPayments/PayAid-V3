'use client'

import { useParams } from 'next/navigation'
import { VoiceAppShell } from '@/components/voice-agent/VoiceAppShell'
import { VoiceAgentsSidebar } from '@/components/voice-agent/VoiceAgentsSidebar'

const topBarItemsFor = (tenantId: string) => [
  { name: 'Agents', href: `/voice-agents/${tenantId}/Home` },
  { name: 'Calls', href: `/voice-agents/${tenantId}/Calls` },
  { name: 'Campaigns', href: `/voice-agents/${tenantId}/Campaigns` },
  { name: 'Transcripts', href: `/voice-agents/${tenantId}/Transcripts` },
  { name: 'Analytics', href: `/voice-agents/${tenantId}/Analytics` },
  { name: 'Supervisor', href: `/voice-agents/${tenantId}/Monitor` },
]

export default function VoiceAgentsTenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <VoiceAppShell
      moduleName="Voice Agents"
      topBarItems={topBarItemsFor(tenantId)}
      sidebar={<VoiceAgentsSidebar tenantId={tenantId} />}
    >
      {children}
    </VoiceAppShell>
  )
}
