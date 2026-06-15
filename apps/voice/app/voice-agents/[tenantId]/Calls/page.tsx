'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceCallsWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceCallsWorkspace').then((m) => ({
      default: m.VoiceCallsWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading calls…</p>
      </div>
    ),
  }
)

export default function VoiceAgentCallsPage() {
  return <VoiceCallsWorkspace />
}
