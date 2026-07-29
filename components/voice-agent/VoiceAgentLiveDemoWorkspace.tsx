'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Radio } from 'lucide-react'

const BrowserLiveVoiceDemo = dynamic(
  () =>
    import('@/components/voice-agent/BrowserLiveVoiceDemo').then((m) => ({
      default: m.BrowserLiveVoiceDemo,
    })),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading live voice…</div> },
)

const LIVE_DEMO_ENABLED = process.env.NEXT_PUBLIC_VOICE_BROWSER_LIVE_DEMO === '1'

type Agent = { id: string; name: string; status?: string | null; language?: string | null }

export function VoiceAgentLiveDemoWorkspace() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tenantId = params.tenantId as string
  const agentId = searchParams.get('agentId')
  const { token, tenant } = useAuthStore()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(!!agentId)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [ssoPending, setSsoPending] = useState(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).has('sso_token')
  })

  // Allow SSOHydration (providers) one tick to set the token before gating login.
  useEffect(() => {
    if (!ssoPending) return
    const id = window.setTimeout(() => setSsoPending(false), 400)
    return () => window.clearTimeout(id)
  }, [ssoPending])

  useEffect(() => {
    if (!agentId || !token) {
      setLoading(false)
      return
    }
    const url = new URL(`/api/v1/voice-agents/${agentId}`, window.location.origin)
    url.searchParams.set('tenantId', tenantId)
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error((j as { error?: string }).error || r.statusText)
        }
        return r.json()
      })
      .then(setAgent)
      .catch((e) => setFetchError(e instanceof Error ? e.message : 'Failed to load agent'))
      .finally(() => setLoading(false))
  }, [agentId, token, tenantId])

  if (!LIVE_DEMO_ENABLED) {
    return (
      <div className="container mx-auto p-6 max-w-lg">
        <p className="text-muted-foreground">
          Live voice demo is disabled. Set{' '}
          <code className="text-xs">NEXT_PUBLIC_VOICE_BROWSER_LIVE_DEMO=1</code> and redeploy, or use{' '}
          <Link href={`/voice-agents/${tenantId}/Demo`} className="underline">
            Browser demo (text)
          </Link>
          .
        </p>
      </div>
    )
  }

  if (!token && ssoPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!token) {
    return (
      <div className="container mx-auto p-6 max-w-lg text-center space-y-4">
        <p className="text-muted-foreground">Please log in to use live voice demo.</p>
        <Link href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/voice-agents/${tenantId}/LiveDemo`)}`}>
          <Button>Log in</Button>
        </Link>
      </div>
    )
  }

  if (!agentId) {
    return (
      <div className="container mx-auto p-6 max-w-lg">
        <p className="text-muted-foreground">
          Add <code className="text-xs">?agentId=…</code> or open from Home → Live voice on an agent row.
        </p>
        <Link href={`/voice-agents/${tenantId}/Home`}>
          <Button variant="outline" className="mt-4">
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (fetchError || !agent) {
    return (
      <div className="container mx-auto p-6 max-w-lg">
        <p className="text-destructive">{fetchError || 'Agent not found'}</p>
        <Link href={`/voice-agents/${tenantId}/Home`}>
          <Button variant="outline" className="mt-4">
            Back
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="border-b bg-white dark:bg-gray-800 p-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/voice-agents/${tenantId}/Home`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Radio className="h-6 w-6 text-violet-600" />
                Live voice — {agent.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Investor browser demo · speak & interrupt · no phone line
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-violet-600">Live voice</Badge>
            <Badge variant="outline">Browser (WSS)</Badge>
            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>{agent.status}</Badge>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 container mx-auto max-w-3xl">
        {token ? (
          <BrowserLiveVoiceDemo
            agentId={agentId}
            tenantId={tenantId}
            token={token}
            agentName={agent.name}
          />
        ) : null}
        {tenant?.id && tenant.id !== tenantId ? (
          <p className="text-xs text-amber-600 mt-2">URL tenant may differ from logged-in workspace.</p>
        ) : null}
      </div>
    </div>
  )
}
