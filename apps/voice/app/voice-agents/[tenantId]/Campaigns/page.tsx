'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceCampaignsWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceCampaignsWorkspace').then((m) => ({
      default: m.VoiceCampaignsWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading campaigns…</p>
      </div>
    ),
  }
)

export default function VoiceAgentCampaignsPage() {
  return <VoiceCampaignsWorkspace />
}
