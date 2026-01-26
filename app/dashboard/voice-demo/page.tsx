'use client'

import { VoiceInterfaceDemo } from '@/components/VoiceInterfaceDemo'
import { ModuleTopBar } from '@/components/modules/ModuleTopBar'

export default function VoiceDemoPage() {
  return (
    <div className="flex flex-col h-full">
      <ModuleTopBar title="Voice Interface Demo" module="ai-studio" />
      <main className="flex-1 overflow-y-auto">
        <VoiceInterfaceDemo />
      </main>
    </div>
  )
}
