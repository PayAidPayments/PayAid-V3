'use client'

import { useMemo, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Siren, RotateCcw } from 'lucide-react'

type OutboxMetricsResponse = {
  tenantId: string
  metrics: {
    queuedCount: number
    dispatchedCount: number
    dlqCount: number
    queueCounts: Record<string, number>
  }
  alerts: Array<{ code: string; severity: 'warning' | 'critical'; message: string }>
}

type OutboxHealthResponse = {
  tenantId: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  redis: { connected: boolean; error?: string }
  outbox: {
    dispatcherInitialized: boolean
    queueInterfaceHealthy: boolean
    lastDispatchAt: string | null
    lastDispatchOutboxId: string | null
    lastDlqAt: string | null
    lastDlqOutboxId: string | null
  }
}

type ReconciliationHistoryResponse = {
  tenantId: string
  filters?: {
    riskyOnly: boolean
    dlqMin: number
    driftMin: number
    limit: number
  }
  runs: Array<{
    id: string
    runAt: string
    summary: string
    details: any
    hasRisk: boolean
    dlqCount: number
    driftCount: number
  }>
}

type ReconciliationTelemetryResponse = {
  tenantId: string
  telemetry: {
    lastRunAt: string | null
    lastRunSummary: string | null
    runsLast24h: number
    riskyRunsLast24h: number
  }
}

type ReconciliationTrendsResponse = {
  tenantId: string
  days: number
  trend: Array<{
    date: string
    totalRuns: number
    riskyRuns: number
  }>
}

export default function OutboxOpsPage() {
  const { token } = useAuthStore()
  const [metrics, setMetrics] = useState<OutboxMetricsResponse | null>(null)
  const [health, setHealth] = useState<OutboxHealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<ReconciliationHistoryResponse | null>(null)
  const [telemetry, setTelemetry] = useState<ReconciliationTelemetryResponse | null>(null)
  const [trends, setTrends] = useState<ReconciliationTrendsResponse | null>(null)
  const [runningRecon, setRunningRecon] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [riskyOnly, setRiskyOnly] = useState(false)
  const [dlqMin, setDlqMin] = useState('0')
  const [driftMin, setDriftMin] = useState('0')
  const [replayId, setReplayId] = useState('')
  const [replayState, setReplayState] = useState<{ ok: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const healthBadgeClass = useMemo(() => {
    if (!health) return 'bg-slate-100 text-slate-700'
    if (health.status === 'healthy') return 'bg-emerald-100 text-emerald-700'
    if (health.status === 'degraded') return 'bg-amber-100 text-amber-700'
    return 'bg-rose-100 text-rose-700'
  }, [health])

  async function loadOps() {
    try {
      setLoading(true)
      setError(null)
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const [metricsRes, healthRes, telemetryRes, trendsRes] = await Promise.all([
        fetch('/api/v1/outbox/metrics', { headers }),
        fetch('/api/v1/outbox/health', { headers }),
        fetch('/api/v1/outbox/reconciliation/telemetry', { headers }),
        fetch('/api/v1/outbox/reconciliation/trends?days=7', { headers }),
      ])
      const historyParams = new URLSearchParams({
        limit: '10',
        riskyOnly: riskyOnly ? '1' : '0',
        dlqMin: dlqMin || '0',
        driftMin: driftMin || '0',
      })
      const historyRes = await fetch(`/api/v1/outbox/reconciliation/history?${historyParams.toString()}`, {
        headers,
      })
      if (!metricsRes.ok || !healthRes.ok || !historyRes.ok || !telemetryRes.ok || !trendsRes.ok) {
        throw new Error('Failed to fetch outbox operations data')
      }
      setMetrics(await metricsRes.json())
      setHealth(await healthRes.json())
      setHistory(await historyRes.json())
      setTelemetry(await telemetryRes.json())
      setTrends(await trendsRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch outbox operations data')
    } finally {
      setLoading(false)
    }
  }

  async function replayDlq() {
    if (!replayId.trim()) return
    try {
      setReplayState(null)
      const res = await fetch('/api/v1/outbox/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ outboxId: replayId.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReplayState({ ok: false, message: json.error || 'Replay failed' })
        return
      }
      setReplayState({ ok: true, message: 'Replay queued successfully' })
      await loadOps()
    } catch (err) {
      setReplayState({
        ok: false,
        message: err instanceof Error ? err.message : 'Replay failed',
      })
    }
  }

  async function runReconciliationNow() {
    try {
      setRunningRecon(true)
      setError(null)
      const res = await fetch('/api/v1/outbox/reconciliation/run', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || 'Failed to run reconciliation')
      }
      await loadOps()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run reconciliation')
    } finally {
      setRunningRecon(false)
    }
  }

  async function exportReconciliationCsv() {
    try {
      setExportingCsv(true)
      const params = new URLSearchParams({
        limit: '500',
        riskyOnly: riskyOnly ? '1' : '0',
        dlqMin: dlqMin || '0',
        driftMin: driftMin || '0',
      })
      const res = await fetch(`/api/v1/outbox/reconciliation/history/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to export CSV')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'outbox-reconciliation-history.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV')
    } finally {
      setExportingCsv(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Outbox Operations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Reliability controls for outbox dispatch, DLQ, and replay.
          </p>
        </div>
        <Button onClick={loadOps} disabled={loading} title={loading ? 'Refreshing...' : 'Refresh outbox operations'}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={runReconciliationNow}
          disabled={runningRecon}
          title={runningRecon ? 'Running...' : 'Run reconciliation now'}
        >
          {runningRecon ? 'Running...' : 'Run Reconciliation Now'}
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Queued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics?.metrics.queuedCount ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dispatched</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics?.metrics.dispatchedCount ?? '-'}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">DLQ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metrics?.metrics.dlqCount ?? '-'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Health Status
          </CardTitle>
          <CardDescription>Redis + dispatcher + queue readiness checks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${healthBadgeClass}`}>
            {health?.status || 'unknown'}
          </span>
          <p className="text-xs text-slate-500">Redis connected: {String(health?.redis.connected ?? false)}</p>
          <p className="text-xs text-slate-500">Dispatcher initialized: {String(health?.outbox.dispatcherInitialized ?? false)}</p>
          <p className="text-xs text-slate-500">Queue interface healthy: {String(health?.outbox.queueInterfaceHealthy ?? false)}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm">Reconciliation History</CardTitle>
          <CardDescription>Recent outbox reconciliation runs for this tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={riskyOnly} onChange={(e) => setRiskyOnly(e.target.checked)} />
              Risky only
            </label>
            <Input value={dlqMin} onChange={(e) => setDlqMin(e.target.value)} placeholder="dlqMin" />
            <Input value={driftMin} onChange={(e) => setDriftMin(e.target.value)} placeholder="driftMin" />
            <Button variant="outline" onClick={loadOps}>Apply Filters</Button>
          </div>
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={exportReconciliationCsv}
              disabled={exportingCsv}
              title={exportingCsv ? 'Exporting...' : 'Export filtered reconciliation runs to CSV'}
            >
              {exportingCsv ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 mb-4">
            <p className="text-xs text-slate-500">
              Last 24h runs: {telemetry?.telemetry.runsLast24h ?? '-'} · risky runs: {telemetry?.telemetry.riskyRunsLast24h ?? '-'}
            </p>
            <p className="text-xs text-slate-500">
              Last run: {telemetry?.telemetry.lastRunAt ? new Date(telemetry.telemetry.lastRunAt).toLocaleString() : '-'}
            </p>
          </div>

          {!history || history.runs.length === 0 ? (
            <p className="text-sm text-slate-500">No reconciliation runs recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {history.runs.map((run) => (
                <div key={run.id} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <p className="text-sm font-medium">{new Date(run.runAt).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{run.summary}</p>
                  <p className="text-xs text-slate-500">
                    risk={String(run.hasRisk)} · dlq={run.dlqCount} · drift={run.driftCount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm">Reconciliation Trends (7 days)</CardTitle>
          <CardDescription>Daily run volume and risky-run counts.</CardDescription>
        </CardHeader>
        <CardContent>
          {!trends || trends.trend.length === 0 ? (
            <p className="text-sm text-slate-500">No trend data yet.</p>
          ) : (
            <div className="space-y-2">
              {trends.trend.map((row) => (
                <div key={row.date} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <p className="text-sm font-medium">{row.date}</p>
                  <p className="text-xs text-slate-500">
                    total runs={row.totalRuns} · risky runs={row.riskyRuns}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Siren className="w-4 h-4 text-amber-600" />
            Alerts
          </CardTitle>
          <CardDescription>Threshold-derived outbox alerts from metrics endpoint.</CardDescription>
        </CardHeader>
        <CardContent>
          {!metrics || metrics.alerts.length === 0 ? (
            <p className="text-sm text-slate-500">No active outbox alerts.</p>
          ) : (
            <div className="space-y-2">
              {metrics.alerts.map((alert) => (
                <div key={alert.code} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <p className="text-sm font-medium">{alert.code}</p>
                  <p className="text-xs text-slate-500">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            Replay DLQ Event
          </CardTitle>
          <CardDescription>Queue replay for a specific outboxId from dead-letter records.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input value={replayId} onChange={(e) => setReplayId(e.target.value)} placeholder="outboxId" />
          <Button onClick={replayDlq} disabled={!replayId.trim()} title={!replayId.trim() ? 'Provide outboxId' : 'Queue replay'}>
            Replay
          </Button>
          {replayState ? (
            <p className={`text-xs ${replayState.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{replayState.message}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
