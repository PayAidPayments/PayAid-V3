'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceAnalyticsWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceAnalyticsWorkspace').then((m) => ({
      default: m.VoiceAnalyticsWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading analytics…</p>
      </div>
    ),
  }
)

export default function VoiceAgentAnalyticsPage() {
  return <VoiceAnalyticsWorkspace />
}
