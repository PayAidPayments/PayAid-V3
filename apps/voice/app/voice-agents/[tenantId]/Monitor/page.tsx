'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const VoiceSupervisorMonitorWorkspace = dynamic(
  () =>
    import('@/components/voice-agent/VoiceSupervisorMonitorWorkspace').then((m) => ({
      default: m.VoiceSupervisorMonitorWorkspace,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading supervisor monitor…</p>
      </div>
    ),
  },
)

export default function VoiceSupervisorMonitorPage() {
  return <VoiceSupervisorMonitorWorkspace />
}
