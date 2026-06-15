'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

/**
 * Thin route entry: demo UI lives in VoiceAgentDemoWorkspace (~2.5k lines) so other
 * voice routes do not pull it into the dev compile graph until /Demo is opened.
 */
const VoiceAgentDemoWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceAgentDemoWorkspace').then((m) => ({
      default: m.VoiceAgentDemoWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading voice demo…</p>
      </div>
    ),
  }
)

export default function VoiceAgentDemoPage() {
  return <VoiceAgentDemoWorkspace />
}
