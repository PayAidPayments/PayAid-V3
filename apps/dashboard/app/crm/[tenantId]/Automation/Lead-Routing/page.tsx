'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import type { LeadRoutingConfigV1 } from '@/lib/crm/lead-routing'
import { coerceLeadRoutingConfigV1 } from '@/lib/crm/lead-routing/config-schema'
import { Plus, Trash2 } from 'lucide-react'

type SalesRepOption = { id: string; userId: string; name: string; email: string | null }

type SourceRow = { key: string; salesRepId: string }

export default function LeadRoutingPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salesReps, setSalesReps] = useState<SalesRepOption[]>([])
  const [enabled, setEnabled] = useState(false)
  const [primaryStrategy, setPrimaryStrategy] = useState<LeadRoutingConfigV1['primaryStrategy']>(
    'territory_then_smart'
  )
  const [fallbackSalesRepId, setFallbackSalesRepId] = useState<string | null>(null)
  const [sourceRows, setSourceRows] = useState<SourceRow[]>([])

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/crm/lead-routing?tenantId=${encodeURIComponent(tenantId)}`,
        { headers: getAuthHeaders() }
      )
      const text = await res.text()
      let json: Record<string, unknown> = {}
      try {
        if (text) json = JSON.parse(text) as Record<string, unknown>
      } catch {
        setError(
          `Lead routing API returned a non-JSON response (HTTP ${res.status}). Check that /api/crm/lead-routing is deployed.`
        )
        return
      }
      if (!res.ok) {
        const msg =
          typeof json.error === 'string'
            ? json.error
            : `Failed to load lead routing (HTTP ${res.status})`
        setError(msg)
        return
      }
      const cfg = coerceLeadRoutingConfigV1(json.config)
      const repsRaw = json.salesReps
      const reps = Array.isArray(repsRaw)
        ? (repsRaw as SalesRepOption[]).filter(
            (r) => r && typeof r.id === 'string' && typeof r.userId === 'string'
          )
        : []
      setSalesReps(reps)
      setEnabled(cfg.enabled)
      setPrimaryStrategy(cfg.primaryStrategy)
      setFallbackSalesRepId(cfg.fallbackSalesRepId ?? null)
      const map = cfg.sourceChannelToSalesRepId ?? {}
      setSourceRows(Object.entries(map).map(([key, salesRepId]) => ({ key, salesRepId })))
    } catch {
      setError('Failed to load lead routing (network or unexpected error).')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    if (!tenantId) return
    setSaving(true)
    setError(null)
    const sourceChannelToSalesRepId: Record<string, string> = {}
    for (const row of sourceRows) {
      const k = row.key.trim().toLowerCase()
      if (k && row.salesRepId) sourceChannelToSalesRepId[k] = row.salesRepId
    }
    const body: LeadRoutingConfigV1 = {
      version: 1,
      enabled,
      primaryStrategy,
      fallbackSalesRepId: fallbackSalesRepId || null,
      sourceChannelToSalesRepId,
    }
    try {
      const res = await fetch(
        `/api/crm/lead-routing?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: 'PATCH',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || 'Failed to save')
        return
      }
      await load()
    } catch {
      setError('Failed to save lead routing')
    } finally {
      setSaving(false)
    }
  }

  if (loading && salesReps.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-5 dark:bg-slate-950">
        <PageLoading message="Loading lead routing…" fullScreen={false} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
        <nav>
          <Link
            href={`/crm/${tenantId}/Automation`}
            className="text-xs font-medium text-violet-700 hover:underline dark:text-violet-300"
          >
            ← CRM automation
          </Link>
        </nav>

        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Lead routing</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            When enabled, unassigned inbound leads use this order: same-account sibling owner →
            source-channel rules → territory match → smart workload allocation → fallback rep. Existing
            owners and explicit assignment from the API are always kept.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <Card className="rounded-2xl border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Automatic assignment</CardTitle>
            <CardDescription>
              Applies to orchestrated paths (forms, chatbots, manual API create, deals wizard, and so on).
              Bulk CSV imports skip routing by default.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <Label htmlFor="routing-enabled" className="text-sm font-medium">
                  Enable auto-assignment
                </Label>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Only runs when the lead has no owner yet.
                </p>
              </div>
              <Switch
                id="routing-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Primary strategy</Label>
              <Select
                value={primaryStrategy}
                onValueChange={(v) =>
                  setPrimaryStrategy(v as LeadRoutingConfigV1['primaryStrategy'])
                }
                disabled={saving}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="territory_then_smart">
                    Territory match, then smart allocation
                  </SelectItem>
                  <SelectItem value="territory">Territory only</SelectItem>
                  <SelectItem value="smart">Smart allocation only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Fallback sales rep</Label>
              <Select
                value={fallbackSalesRepId ?? '__none__'}
                onValueChange={(v) => setFallbackSalesRepId(v === '__none__' ? null : v)}
                disabled={saving}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {salesReps.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {r.email ? ` (${r.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Source channel overrides</Label>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Match inbound <code className="text-xs">sourceChannel</code> (lowercase) to a rep—for
                  example <code className="text-xs">web_form</code>, <code className="text-xs">website_chatbot</code>.
                </p>
              </div>
              <div className="space-y-2">
                {sourceRows.map((row, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[140px] flex-1">
                      <Input
                        placeholder="source channel"
                        value={row.key}
                        onChange={(e) => {
                          const next = [...sourceRows]
                          next[idx] = { ...next[idx], key: e.target.value }
                          setSourceRows(next)
                        }}
                        disabled={saving}
                      />
                    </div>
                    <Select
                      value={row.salesRepId || '__pick__'}
                      onValueChange={(v) => {
                        const next = [...sourceRows]
                        next[idx] = { ...next[idx], salesRepId: v === '__pick__' ? '' : v }
                        setSourceRows(next)
                      }}
                      disabled={saving}
                    >
                      <SelectTrigger className="min-w-[220px] flex-1">
                        <SelectValue placeholder="Sales rep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__pick__">Select rep…</SelectItem>
                        {salesReps.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      title="Remove row"
                      disabled={saving}
                      onClick={() => setSourceRows(sourceRows.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={saving}
                  onClick={() => setSourceRows([...sourceRows, { key: '', salesRepId: '' }])}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add source rule
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" disabled={saving} title={saving ? 'Saving…' : undefined} onClick={() => void save()}>
                {saving ? 'Saving…' : 'Save settings'}
              </Button>
              <Button type="button" variant="outline" disabled={saving} onClick={() => void load()}>
                Reload
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
