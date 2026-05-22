'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceStudioWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceStudioWorkspace').then((m) => ({
      default: m.VoiceStudioWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading studio…</p>
      </div>
    ),
  }
)

export default function VoiceAgentStudioPage() {
  return <VoiceStudioWorkspace />
}
