'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Headphones } from 'lucide-react'

type MonitorFeed = {
  recentEvents: Array<{ event: string; at: string; sessionId?: string; meta?: Record<string, unknown> }>
  escalations: Array<{
    sessionId: string
    agentId: string
    agentName?: string
    endedAt?: string
    transferRequested?: boolean
    handoff: { summary?: string; callerPhone?: string; sentiment?: string; transcriptPreview?: string }
  }>
  pendingTriggers: Array<{
    campaignContactId: string
    campaignId: string
    campaignName: string
    phone: string
    name?: string | null
    triggerKind?: string
    triggeredAt?: string
  }>
  analytics: {
    endedCount: number
    sentiment: { positive: number; negative: number; neutral: number }
    objectionTags: Record<string, number>
    followUpTasksCreated: number
    bargeInSessions: number
  }
}

export function VoiceSupervisorMonitorWorkspace() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [feed, setFeed] = useState<MonitorFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acking, setAcking] = useState<string | null>(null)
  const [transferring, setTransferring] = useState<string | null>(null)
  const [dialing, setDialing] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setError(null)
      const url = new URL('/api/v1/voice-agents/supervisor/monitor', window.location.origin)
      url.searchParams.set('tenantId', tenantId)
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText)
      const data = await res.json()
      setFeed(data.feed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, tenantId])

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 15_000)
    return () => clearInterval(id)
  }, [load])

  const ackEscalation = async (sessionId: string) => {
    if (!token) return
    setAcking(sessionId)
    try {
      const res = await fetch(`/api/v1/voice-agents/escalations/${sessionId}/ack`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Ack failed')
      await load()
    } finally {
      setAcking(null)
    }
  }

  const transferEscalation = async (sessionId: string) => {
    if (!token) return
    setTransferring(sessionId)
    try {
      const res = await fetch(`/api/v1/voice-agents/escalations/${sessionId}/transfer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoDial: true }),
      })
      if (!res.ok) throw new Error('Transfer failed')
      await load()
    } finally {
      setTransferring(null)
    }
  }

  const dialCampaignTick = async (campaignId: string) => {
    if (!token) return
    setDialing(campaignId)
    try {
      const res = await fetch(`/api/v1/voice-agents/campaigns/${campaignId}/tick`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Dial tick failed')
      await load()
    } finally {
      setDialing(null)
    }
  }

  if (loading && !feed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading supervisor monitor…
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="h-7 w-7" />
            Supervisor monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live voice events, escalation queue, and outbound trigger backlog.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {feed?.analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ended sessions</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{feed.analytics.endedCount}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Escalations open</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{feed.escalations.length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trigger queue</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{feed.pendingTriggers.length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Follow-up tasks</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{feed.analytics.followUpTasksCreated}</CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escalation queue</CardTitle>
          <CardDescription>Calls requesting human handoff — acknowledge when assigned.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!feed?.escalations.length ? (
            <p className="text-sm text-muted-foreground">No open escalations.</p>
          ) : (
            feed.escalations.map((row) => (
              <div
                key={row.sessionId}
                className="rounded-lg border p-3 text-sm space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="destructive">escalation</Badge>
                  <span className="font-medium">{row.agentName || row.agentId}</span>
                  {row.handoff.callerPhone ? (
                    <span className="text-muted-foreground">{row.handoff.callerPhone}</span>
                  ) : null}
                </div>
                <p>{row.handoff.summary || row.handoff.transcriptPreview || 'No summary'}</p>
                <div className="flex flex-wrap gap-2">
                  {!row.transferRequested ? (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={transferring === row.sessionId || !row.handoff.callerPhone}
                      onClick={() => void transferEscalation(row.sessionId)}
                    >
                      {transferring === row.sessionId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Queue callback'
                      )}
                    </Button>
                  ) : (
                    <Badge variant="secondary">Callback queued</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={acking === row.sessionId}
                    onClick={() => void ackEscalation(row.sessionId)}
                  >
                    {acking === row.sessionId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Acknowledge'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outbound trigger queue</CardTitle>
          <CardDescription>Pending campaign contacts from webhooks (not yet dialed).</CardDescription>
        </CardHeader>
        <CardContent>
          {!feed?.pendingTriggers.length ? (
            <p className="text-sm text-muted-foreground">Queue empty.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {feed.pendingTriggers.slice(0, 20).map((t) => (
                <li
                  key={t.campaignContactId}
                  className="flex flex-wrap items-center gap-2 border-b pb-2"
                >
                  <span className="font-mono">{t.phone}</span>
                  <span className="text-muted-foreground">{t.campaignName}</span>
                  {t.triggerKind ? <Badge variant="outline">{t.triggerKind}</Badge> : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    disabled={dialing === t.campaignId}
                    onClick={() => void dialCampaignTick(t.campaignId)}
                  >
                    {dialing === t.campaignId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Dial next'
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent voice events</CardTitle>
          <CardDescription>From browser-live session metadata (auto-refreshes).</CardDescription>
        </CardHeader>
        <CardContent>
          {!feed?.recentEvents.length ? (
            <p className="text-sm text-muted-foreground">No events yet — run a Live Demo session.</p>
          ) : (
            <ul className="text-xs font-mono space-y-1 max-h-64 overflow-y-auto">
              {feed.recentEvents.map((e, i) => (
                <li key={`${e.at}-${i}`} className="text-muted-foreground">
                  <span className="text-foreground">{e.event}</span> · {e.at.slice(11, 19)}
                  {e.sessionId ? ` · ${e.sessionId.slice(0, 10)}…` : ''}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
