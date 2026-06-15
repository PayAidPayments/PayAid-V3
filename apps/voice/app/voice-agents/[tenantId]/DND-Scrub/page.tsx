'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceDndScrubWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceDndScrubWorkspace').then((m) => ({
      default: m.VoiceDndScrubWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading DND scrub…</p>
      </div>
    ),
  }
)

export default function DNDScrubPage() {
  return <VoiceDndScrubWorkspace />
}
