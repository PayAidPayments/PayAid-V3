'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceTranscriptsWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceTranscriptsWorkspace').then((m) => ({
      default: m.VoiceTranscriptsWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading transcripts…</p>
      </div>
    ),
  }
)

export default function VoiceAgentTranscriptsPage() {
  return <VoiceTranscriptsWorkspace />
}
