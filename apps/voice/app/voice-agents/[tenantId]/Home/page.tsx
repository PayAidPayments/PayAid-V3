'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceAgentsHomeWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceAgentsHomeWorkspace').then((m) => ({
      default: m.VoiceAgentsHomeWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading voice agents…</p>
      </div>
    ),
  }
)

export default function VoiceAgentsHomePage() {
  return <VoiceAgentsHomeWorkspace />
}
