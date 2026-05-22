'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const RealTimeVoiceDemo = dynamic(
  () =>
    import('@/components/voice-agent/RealTimeVoiceDemo').then((m) => ({
      default: m.RealTimeVoiceDemo,
    })),
  { ssr: false }
)

type Props = {
  agent: { id: string; name: string; language?: string | null }
  tenantId: string
  token: string
}

/** Experimental mic/WebSocket demo — separate chunk; only loaded when env flag is set. */
export function VoiceAgentDemoExperimentalPanel({ agent, tenantId, token }: Props) {
  const router = useRouter()

  return (
    <Card className="border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base text-amber-900 dark:text-amber-100">
          Experimental realtime demo
        </CardTitle>
        <CardDescription className="text-amber-800/90 dark:text-amber-200/80">
          Mic/WebSocket path — not the supported v1 browser demo. For development only; enable with{' '}
          <code className="text-xs rounded bg-muted px-1">NEXT_PUBLIC_VOICE_EXPERIMENTAL_REALTIME_DEMO=1</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <RealTimeVoiceDemo
          agentId={agent.id}
          agentName={agent.name}
          agentLanguage={agent.language ?? undefined}
          token={token}
          tenantId={tenantId}
          onBack={() => router.push(`/voice-agents/${tenantId}/Demo`)}
        />
      </CardContent>
    </Card>
  )
}
