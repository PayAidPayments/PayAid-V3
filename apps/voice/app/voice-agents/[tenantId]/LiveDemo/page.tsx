'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceAgentLiveDemoWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceAgentLiveDemoWorkspace').then((m) => ({
      default: m.VoiceAgentLiveDemoWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading live voice demo…</p>
      </div>
    ),
  },
)

export default function VoiceAgentLiveDemoPage() {
  return <VoiceAgentLiveDemoWorkspace />
}
