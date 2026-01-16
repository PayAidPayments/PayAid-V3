'use client'

import { useParams } from 'next/navigation'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <VoiceAgentsSidebar tenantId={tenantId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ModuleTopBar
          moduleId="voice-agents"
          moduleName="Voice Agents"
          items={topBarItems}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

