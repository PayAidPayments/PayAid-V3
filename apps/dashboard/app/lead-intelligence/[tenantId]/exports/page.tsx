'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'
import { LeadIntelligenceM1StepIndicator } from '@/components/lead-intelligence/LeadIntelligenceM1StepIndicator'
import { useLeadIntelligenceM1Progress } from '@/components/lead-intelligence/useLeadIntelligenceM1Progress'

type ExportHistoryItem = {
  id: string
  status: string
  exportType: string
  resultSummary?: {
    rowCount?: number
    generatedAt?: string
  }
  createdAt: string
}

export default function LeadIntelligenceExportsPage() {
  const tenantId = String(useParams()?.tenantId || '')
  const token = useAuthStore((s) => s.token)
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [industry, setIndustry] = useState(searchParams.get('industry') ?? '')
  const [country, setCountry] = useState(searchParams.get('country') ?? '')
  const [limit, setLimit] = useState('100')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lastFailedAttemptAt, setLastFailedAttemptAt] = useState<string | null>(null)
  const [history, setHistory] = useState<ExportHistoryItem[]>([])
  const { completedSteps, markCompleted, resetProgress } = useLeadIntelligenceM1Progress(tenantId)

  const canRun = useMemo(
    () => q.trim().length > 1 || industry.trim().length > 0 || country.trim().length > 0,
    [q, industry, country]
  )

  async function loadHistory() {
    if (!token) return
    try {
      const response = await fetch('/api/lead-intelligence/exports', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load export history')
      setHistory(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load export history')
    }
  }

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (q || industry || country) markCompleted('search', 'companies', 'saved-searches')
    if (history.length > 0) markCompleted('exports')
  }, [q, industry, country, history.length, markCompleted])

  async function runExport() {
    if (!token || !canRun) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/lead-intelligence/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ q: q.trim(), industry: industry.trim(), country: country.trim(), limit: Number(limit) || 100 }),
      })
      const data = await response.json()
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Export failed')
      const blob = new Blob([String(data.csv || '')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = String(data.filename || 'lead-intelligence-export.csv')
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      markCompleted('exports')
      await loadHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
      setLastFailedAttemptAt(new Date().toISOString())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <LeadIntelligenceM1StepIndicator
        tenantId={tenantId}
        currentStep="exports"
        completedSteps={completedSteps}
        onResetProgress={resetProgress}
      />
      <Card>
        <CardHeader>
          <CardTitle>Step 4: Export results (CSV)</CardTitle>
          <CardDescription>Finalize discovery with export-first delivery, without requiring CRM activation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="q">Query</Label>
            <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. logistics, healthcare" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Limit</Label>
            <Input id="limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={runExport} disabled={!canRun || busy} className="w-full">
              {busy ? 'Exporting...' : 'Download CSV'}
            </Button>
            <Button onClick={loadHistory} disabled={busy} variant="outline" className="w-full">
              Refresh history
            </Button>
          </div>
          {error ? (
            <div className="md:col-span-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-2">
              <p>{error}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={runExport} disabled={!canRun || busy}>
                  Retry export
                </Button>
                <Button size="sm" variant="outline" onClick={loadHistory} disabled={busy}>
                  Reload history
                </Button>
              </div>
              {lastFailedAttemptAt ? (
                <p className="text-xs text-red-600">Last failed attempt: {new Date(lastFailedAttemptAt).toLocaleString()}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export run history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exports yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="border rounded-md p-3 text-sm">
                  <p className="font-medium">{item.exportType}</p>
                  <p className="text-xs text-muted-foreground">
                    status={item.status} | rows={item.resultSummary?.rowCount ?? '-'} | createdAt={new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
