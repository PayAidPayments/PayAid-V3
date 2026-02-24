'use client'

import { useParams } from 'next/navigation'
import { AppShell } from '@/components/modules/AppShell'
import { VoiceAgentsSidebar } from '@/components/voice-agent/VoiceAgentsSidebar'

export default function VoiceAgentsHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const tenantId = params.tenantId as string

  const topBarItems = [
    { name: 'Agents', href: `/voice-agents/${tenantId}/Home` },
    { name: 'Calls', href: `/voice-agents/${tenantId}/Calls` },
    { name: 'Analytics', href: `/voice-agents/${tenantId}/Analytics` },
  ]

  return (
    <AppShell
      moduleId="voice-agents"
      moduleName="Voice Agents"
      topBarItems={topBarItems}
      sidebar={<VoiceAgentsSidebar tenantId={tenantId} />}
    >
      {children}
    </AppShell>
  )
}

