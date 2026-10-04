'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

type RunbookSlug = 'sales-follow-up' | 'gst-invoice-draft'

type Runbook = {
  slug: RunbookSlug
  title: string
  summary: string
  requiresApproval: boolean
}

type DraftRow = {
  draftId: string
  flow: RunbookSlug
  approvalStatus: string
  createdAt: string
  changedBy: string
  bundle: {
    draft: Record<string, unknown>
    approvalStatus: string
    executable: boolean
  }
  reason?: string
}

type OrchestrateResponse = {
  allowed: boolean
  reasonCode: string
  reason: string
  runbook?: RunbookSlug
  title?: string
  attempt?: number
  maxAttempts?: number
  escalated?: boolean
  bundle?: {
    draftId: string
    approvalStatus: string
    executable: boolean
    draft: Record<string, unknown>
  } | null
  error?: string
  code?: string
}

export default function CustomerFlowsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()

  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [drafts, setDrafts] = useState<DraftRow[]>([])
  const [runbook, setRunbook] = useState<RunbookSlug>('sales-follow-up')
  const [loadingDrafts, setLoadingDrafts] = useState(true)
  const [running, setRunning] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OrchestrateResponse | null>(null)

  const [contactName, setContactName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [dealValueInr, setDealValueInr] = useState('100000')
  const [notes, setNotes] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerGstin, setCustomerGstin] = useState('')
  const [placeOfSupply, setPlaceOfSupply] = useState('MH')
  const [lineDescription, setLineDescription] = useState('Implementation services')
  const [lineHsn, setLineHsn] = useState('998314')
  const [lineQty, setLineQty] = useState('1')
  const [linePrice, setLinePrice] = useState('10000')
  const [lineGst, setLineGst] = useState('18')

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        : null,
    [token]
  )

  const loadDrafts = useCallback(async () => {
    if (!authHeaders) return
    setLoadingDrafts(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/customer-flows/drafts?pending=1', {
        headers: authHeaders,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || data.code || 'Failed to load drafts')
        setDrafts([])
        return
      }
      setDrafts(Array.isArray(data.drafts) ? data.drafts : [])
      if (Array.isArray(data.runbooks) && data.runbooks.length) {
        setRunbooks(data.runbooks)
      }
    } finally {
      setLoadingDrafts(false)
    }
  }, [authHeaders])

  useEffect(() => {
    void loadDrafts()
  }, [loadDrafts])

  const selectedRunbook = runbooks.find((r) => r.slug === runbook)

  const runOrchestrator = async () => {
    if (!authHeaders) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const payload =
        runbook === 'sales-follow-up'
          ? {
              runbook,
              contactName: contactName.trim(),
              companyName: companyName.trim() || undefined,
              dealValueInr: Number(dealValueInr) || 0,
              notes: notes.trim() || undefined,
            }
          : {
              runbook,
              customerName: customerName.trim(),
              customerGstin: customerGstin.trim() || undefined,
              supplierStateCode: 'KA',
              placeOfSupplyStateCode: placeOfSupply.trim() || 'KA',
              lineItems: [
                {
                  description: lineDescription.trim() || 'Service',
                  hsn: lineHsn.trim() || undefined,
                  quantity: Number(lineQty) || 1,
                  unitPriceInr: Number(linePrice) || 0,
                  gstRatePercent: Number(lineGst) || 0,
                },
              ],
            }

      const res = await fetch('/api/ai/customer-flows/orchestrate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as OrchestrateResponse
      setResult(data)
      if (!res.ok) {
        setError(data.reason || data.error || data.code || 'Orchestrator denied the request')
      }
      await loadDrafts()
    } finally {
      setRunning(false)
    }
  }

  const decideDraft = async (draftId: string, decision: 'approved' | 'rejected') => {
    if (!authHeaders) return
    setActioning(`${decision}-${draftId}`)
    setError(null)
    try {
      const res = await fetch(`/api/ai/customer-flows/drafts/${draftId}/approve`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          decision,
          rejectionReason: decision === 'rejected' ? 'Rejected from Customer Flows UI' : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || data.code || 'Approval action failed')
        return
      }
      await loadDrafts()
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        <div className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href={`/ai-studio/${tenantId}/Agents`}
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Customer Flows</h1>
                <p className="text-sm text-slate-500">
                  Thin orchestrator + draft approval (never sends, files, or pays)
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadDrafts()} disabled={loadingDrafts}>
              {loadingDrafts ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Run a flow</CardTitle>
              <CardDescription>
                {selectedRunbook?.summary || 'Select a runbook and create a draft-only bundle.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="runbook">Runbook</Label>
                <select
                  id="runbook"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={runbook}
                  onChange={(e) => setRunbook(e.target.value as RunbookSlug)}
                >
                  <option value="sales-follow-up">Sales follow-up draft</option>
                  <option value="gst-invoice-draft">GST invoice draft</option>
                </select>
              </div>

              {runbook === 'sales-follow-up' ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName">Contact name</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Asha Rao"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Company</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Rao Traders"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dealValue">Deal value (INR)</Label>
                    <Input
                      id="dealValue"
                      value={dealValueInr}
                      onChange={(e) => setDealValueInr(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Urgent this month; competitor mentioned"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="customerName">Customer name</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Beta Pvt Ltd"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gstin">Customer GSTIN (optional)</Label>
                    <Input
                      id="gstin"
                      value={customerGstin}
                      onChange={(e) => setCustomerGstin(e.target.value)}
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pos">Place of supply state</Label>
                    <Input
                      id="pos"
                      value={placeOfSupply}
                      onChange={(e) => setPlaceOfSupply(e.target.value.toUpperCase())}
                      maxLength={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="lineDesc">Line description</Label>
                      <Input
                        id="lineDesc"
                        value={lineDescription}
                        onChange={(e) => setLineDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="hsn">HSN</Label>
                      <Input id="hsn" value={lineHsn} onChange={(e) => setLineHsn(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="qty">Qty</Label>
                      <Input id="qty" value={lineQty} onChange={(e) => setLineQty(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="price">Unit price (INR)</Label>
                      <Input id="price" value={linePrice} onChange={(e) => setLinePrice(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gst">GST %</Label>
                      <Input id="gst" value={lineGst} onChange={(e) => setLineGst(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={() => void runOrchestrator()} disabled={running || !token}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span className="ml-2">Run orchestrator</span>
              </Button>

              {result && (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={result.allowed ? 'secondary' : 'destructive'}>
                      {result.allowed ? 'Draft created' : result.reasonCode || 'Denied'}
                    </Badge>
                    {result.bundle?.approvalStatus && (
                      <Badge variant="outline">{result.bundle.approvalStatus}</Badge>
                    )}
                    {typeof result.attempt === 'number' && (
                      <span className="text-xs text-slate-500">
                        Attempt {result.attempt}/{result.maxAttempts}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">{result.reason}</p>
                  {result.bundle?.draftId && (
                    <p className="text-xs text-slate-500">Draft ID: {result.bundle.draftId}</p>
                  )}
                  {result.bundle?.draft && (
                    <Textarea
                      className="min-h-40 font-mono text-xs"
                      readOnly
                      value={JSON.stringify(result.bundle.draft, null, 2)}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Pending draft approvals
              </CardTitle>
              <CardDescription>
                Approve only marks drafts ready for human follow-up. Nothing is sent, filed, or paid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDrafts ? (
                <div className="flex items-center gap-2 py-8 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading drafts…
                </div>
              ) : drafts.length === 0 ? (
                <p className="text-sm text-slate-500">No drafts pending approval.</p>
              ) : (
                <ul className="space-y-3">
                  {drafts.map((draft) => (
                    <li
                      key={draft.draftId}
                      className="rounded-lg border border-slate-200 bg-white p-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{draft.flow}</p>
                          <p className="text-xs text-slate-500">{draft.draftId}</p>
                        </div>
                        <Badge variant="outline">{draft.approvalStatus}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(draft.createdAt).toLocaleString()} · by {draft.changedBy}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!actioning}
                          onClick={() => void decideDraft(draft.draftId, 'rejected')}
                        >
                          {actioning === `rejected-${draft.draftId}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span className="ml-1">Reject</span>
                        </Button>
                        <Button
                          size="sm"
                          disabled={!!actioning}
                          onClick={() => void decideDraft(draft.draftId, 'approved')}
                        >
                          {actioning === `approved-${draft.draftId}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          <span className="ml-1">Approve</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4">
                <Link href={`/approvals/${tenantId}`}>
                  <Button variant="ghost" size="sm">
                    Open approvals hub
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
