'use client'

import { useMemo, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BellRing, RefreshCw } from 'lucide-react'

type SignalItem = {
  event_id: string
  event_type: string
  entity_type: 'lead' | 'contact' | 'deal' | 'account'
  entity_id: string
  source: string
  intent_score?: number
  confidence?: number
  occurred_at: string
  payload?: Record<string, unknown>
}

export default function CRMSignalsPage() {
  const { token, tenant } = useAuthStore()
  const tenantId = tenant?.id || ''
  const [entityType, setEntityType] = useState('')
  const [status, setStatus] = useState('')
  const [intentMin, setIntentMin] = useState('0')
  const [signals, setSignals] = useState<SignalItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ingesting, setIngesting] = useState(false)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (entityType) params.set('entityType', entityType)
    if (status) params.set('status', status)
    if (intentMin) params.set('intentMin', intentMin)
    params.set('limit', '100')
    return params.toString()
  }, [entityType, status, intentMin])

  async function fetchSignals() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/v1/signals?${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load signals')
      }
      const data = await response.json()
      setSignals(Array.isArray(data.signals) ? data.signals : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals')
    } finally {
      setLoading(false)
    }
  }

  async function createSampleSignal() {
    if (!tenantId) return
    try {
      setIngesting(true)
      setError(null)
      const sample = {
        schema_version: '1.0',
        tenant_id: tenantId,
        event_id: `sig_${Date.now()}`,
        source: 'manual',
        event_type: 'lead.intent_detected',
        entity_type: 'lead',
        entity_id: `lead_${Date.now()}`,
        occurred_at: new Date().toISOString(),
        confidence: 0.85,
        intent_score: 78,
        payload: { status: 'new', reason: 'manual-test-ingest' },
        trace_id: `trace_${Date.now()}`,
      }

      const response = await fetch('/api/v1/signals/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-idempotency-key': sample.event_id,
        },
        body: JSON.stringify(sample),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Signal ingest failed')
      }

      await fetchSignals()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signal ingest failed')
    } finally {
      setIngesting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Signals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Intent and activity signals that trigger workflows and next actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-page-ai'))}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Ask PayAid AI about these signals
        </button>
      </div>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Filters</CardTitle>
          <CardDescription>Filter signals by entity, intent, and status.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="entityType (lead/contact/deal)"
          />
          <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="status (new/qualified)" />
          <Input value={intentMin} onChange={(e) => setIntentMin(e.target.value)} placeholder="intentMin" />
          <div className="flex gap-2">
            <Button
              onClick={fetchSignals}
              disabled={loading}
              title={loading ? 'Please wait' : 'Refresh signals'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {loading ? 'Loading…' : 'Load Signals'}
            </Button>
            <Button
              variant="outline"
              onClick={createSampleSignal}
              disabled={ingesting}
              title={ingesting ? 'Please wait' : 'Create sample signal'}
            >
              {ingesting ? 'Creating…' : 'Sample Signal'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Signal Feed</CardTitle>
          <CardDescription>Latest tenant-scoped signals available for orchestration.</CardDescription>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 px-4 py-8 text-center">
              <BellRing className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">No signals yet. Ingest a sample signal to test your flow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <div
                  key={signal.event_id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 hover:shadow-md hover:-translate-y-[1px] transition"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{signal.event_type}</p>
                    <Badge variant="outline">{signal.entity_type}</Badge>
                    <Badge variant="outline">{signal.source}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {signal.entity_id} · {new Date(signal.occurred_at).toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span>Intent: {signal.intent_score ?? '-'}</span>
                    <span>Confidence: {signal.confidence ?? '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
