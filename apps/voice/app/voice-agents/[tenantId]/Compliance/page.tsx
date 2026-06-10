'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceComplianceWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceComplianceWorkspace').then((m) => ({
      default: m.VoiceComplianceWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading compliance settings…</p>
      </div>
    ),
  },
)

export default function VoiceCompliancePage() {
  return <VoiceComplianceWorkspace />
}
