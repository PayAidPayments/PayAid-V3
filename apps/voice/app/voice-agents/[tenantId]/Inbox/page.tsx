'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceInboxWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceInboxWorkspace').then((m) => ({
      default: m.VoiceInboxWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading voice inbox…</p>
      </div>
    ),
  },
)

export default function VoiceInboxPage() {
  return <VoiceInboxWorkspace />
}
