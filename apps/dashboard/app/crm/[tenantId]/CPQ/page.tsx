'use client'

import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import {
  CPQHeader,
  CPQMainGrid,
  CPQProgressStrip,
  CPQTabs,
  QuoteSelectorPanel,
  QuoteHealthBanner,
  VersionHistoryPanel,
} from './components'
import { useCPQWorkspace } from './hooks'

export default function CPQPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const {
    seedMessage,
    activeTab,
    setActiveTab,
    catalogSearch,
    setCatalogSearch,
    draftLineItems,
    setDraftLineItems,
    approvalNote,
    setApprovalNote,
    rejectReason,
    setRejectReason,
    quotes,
    selectedQuote,
    setSelectedQuoteId,
    pricing,
    margin,
    approvalRequired,
    approvalReason,
    healthChecks,
    healthScore,
    filteredCatalog,
    isLoading,
    error,
    refetch,
    seedMutation,
    approveMutation,
    convertMutation,
  } = useCPQWorkspace(tenantId)

  if (isLoading) return <PageLoading message="Loading CPQ workspace..." fullScreen={false} />

  if (!quotes.length && !error) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-16 text-center">
            <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No quotes yet</p>
            <p className="text-sm text-slate-500 mb-6">Load guided demo quotes to showcase configure, pricing, approval, and send workflow.</p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={seedMutation.isPending}
                onClick={() => seedMutation.mutate()}
                title={seedMutation.isPending ? 'Seeding demo quotes...' : 'Add demo CPQ records'}
              >
                {seedMutation.isPending ? 'Seeding Demo Quotes...' : 'Seed Demo Quotes'}
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
      {error ? (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Failed to load quotes. Please refresh.
        </div>
      ) : null}
      {seedMessage ? (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {seedMessage}
        </div>
      ) : null}

      <CPQHeader selectedQuote={selectedQuote} onRefresh={() => refetch()} />
      <QuoteHealthBanner healthScore={healthScore} healthChecks={healthChecks} />
      <CPQProgressStrip healthChecks={healthChecks} />

      <CPQMainGrid
        catalogSearch={catalogSearch}
        onCatalogSearchChange={setCatalogSearch}
        filteredCatalog={filteredCatalog}
        approvalRequired={approvalRequired}
        approvalReason={approvalReason}
        draftLineItems={draftLineItems}
        onQtyChange={(id, qty) => {
          setDraftLineItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)))
        }}
        pricing={pricing}
        margin={margin}
        selectedQuote={selectedQuote}
        approvalNote={approvalNote}
        rejectReason={rejectReason}
        onApprovalNoteChange={setApprovalNote}
        onRejectReasonChange={setRejectReason}
        onApprove={() => approveMutation.mutate('approved')}
        onReject={() => approveMutation.mutate('rejected')}
        onConvert={() => convertMutation.mutate()}
        isApproving={approveMutation.isPending}
        isConverting={convertMutation.isPending}
      />

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 space-y-4">
          <CPQTabs activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'builder' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Builder focuses on configuration + line items. Use inline quantity edits to see live total changes.
            </div>
          ) : null}
          {activeTab === 'pricing' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Pricing rules applied: GST 18%, negotiated discounts, and recurring/one-time split.
            </div>
          ) : null}
          {activeTab === 'approvals' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Approval matrix checks discount and total thresholds before send.
            </div>
          ) : null}
          {activeTab === 'document' ? (
            <div data-testid="cpq-document-preview" className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-600 dark:text-slate-300">
              Document Preview loads on demand. Generate customer-facing PDF with version, language, and web quote link.
            </div>
          ) : null}
          {activeTab === 'history' ? <VersionHistoryPanel quotes={quotes} /> : null}
        </CardContent>
      </Card>

      <QuoteSelectorPanel
        quotes={quotes}
        selectedQuoteId={selectedQuote?.id}
        onSelectQuote={setSelectedQuoteId}
      />
    </div>
  )
}
'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { apiRequest } from '@/lib/api/client'
import { CPQHeader } from './components/CPQHeader'
import { CPQMainGrid } from './components/CPQMainGrid'
import { CPQProgressStrip } from './components/CPQProgressStrip'
import { CPQTabs } from './components/CPQTabs'
import { PRODUCT_CATALOG } from './components/constants'
import { QuoteHealthBanner } from './components/QuoteHealthBanner'
import { VersionHistoryPanel } from './components/VersionHistoryPanel'
import { QuotesApiPayload, Quote, WorkspaceTab } from './components/types'
import { formatINR, normalizeQuote, quoteToDraftItems } from './components/utils'

export default function CPQPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const queryClient = useQueryClient()

  const [seedMessage, setSeedMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('builder')
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [draftLineItems, setDraftLineItems] = useState<ReturnType<typeof quoteToDraftItems>>([])
  const [approvalNote, setApprovalNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(catalogSearch), 220)
    return () => clearTimeout(timer)
  }, [catalogSearch])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['v1-quotes', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/quotes')
      if (!res.ok) throw new Error('Failed to load quotes')
      const payload = (await res.json()) as QuotesApiPayload
      return {
        ...payload,
        quotes: Array.isArray(payload.quotes) ? payload.quotes.map(normalizeQuote) : [],
      }
    },
    enabled: !!tenantId,
  })

  const quotes: Quote[] = data?.quotes ?? []
  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === selectedQuoteId) ?? quotes[0] ?? null,
    [quotes, selectedQuoteId]
  )

  useEffect(() => {
    if (quotes.length > 0 && !selectedQuoteId) setSelectedQuoteId(quotes[0].id)
  }, [quotes, selectedQuoteId])

  useEffect(() => {
    setDraftLineItems(quoteToDraftItems(selectedQuote))
  }, [selectedQuote?.id])

  const pricing = useMemo(() => {
    const subtotal = draftLineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
    const discount = draftLineItems.reduce((sum, li) => sum + li.qty * li.unitPrice * li.discountRate, 0)
    const taxable = subtotal - discount
    const tax = draftLineItems.reduce((sum, li) => sum + li.qty * li.unitPrice * (1 - li.discountRate) * li.taxRate, 0)
    const total = taxable + tax
    const recurringTotal = draftLineItems.reduce((sum, li) => {
      if (li.item.toLowerCase().includes('license') || li.item.toLowerCase().includes('support')) {
        return sum + li.qty * li.unitPrice * (1 - li.discountRate)
      }
      return sum
    }, 0)
    return { subtotal, discount, tax, total, recurringTotal, oneTimeTotal: Math.max(0, total - recurringTotal) }
  }, [draftLineItems])

  const margin = useMemo(() => {
    const listPrice = pricing.subtotal
    const soldPrice = pricing.total
    const discountPct = listPrice > 0 ? (pricing.discount / listPrice) * 100 : 0
    const estimatedCost = soldPrice * 0.63
    const marginPct = soldPrice > 0 ? ((soldPrice - estimatedCost) / soldPrice) * 100 : 0
    return { listPrice, soldPrice, discountPct, marginPct }
  }, [pricing])

  const approvalRequired = pricing.total > 250000 || margin.discountPct > 15
  const approvalReason = pricing.total > 250000 ? 'Quote value above ₹2.5L threshold' : 'Discount above 15%'

  const healthChecks = {
    context: !!selectedQuote?.contact && !!selectedQuote?.deal,
    configure: draftLineItems.length > 0,
    pricing: pricing.total > 0,
    approval: !approvalRequired || ['approved', 'accepted', 'converted'].includes(selectedQuote?.status ?? ''),
    send: ['sent', 'accepted', 'converted'].includes(selectedQuote?.status ?? ''),
  }
  const healthScore = Object.values(healthChecks).filter(Boolean).length

  const filteredCatalog = useMemo(() => {
    const filtered = PRODUCT_CATALOG.filter((p) => p.toLowerCase().includes(debouncedSearch.toLowerCase()))
    return filtered.slice(0, 8)
  }, [debouncedSearch])

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['v1-quotes', tenantId] })
  }

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/v1/quotes/seed', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? 'Failed to seed demo quotes')
      return body as { message?: string }
    },
    onSuccess: (body) => {
      setSeedMessage(body.message ?? 'Demo quotes added successfully.')
      handleRefresh()
    },
    onError: (e) => {
      setSeedMessage(e instanceof Error ? e.message : 'Could not seed demo quotes right now.')
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (decision: 'approved' | 'rejected') => {
      if (!selectedQuote) return
      await apiRequest(`/api/v1/quotes/${selectedQuote.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          approver_note: approvalNote,
          reason: rejectReason,
        }),
      })
    },
    onSuccess: () => {
      setApprovalNote('')
      setRejectReason('')
      handleRefresh()
    },
  })

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) return
      await apiRequest(`/api/v1/quotes/${selectedQuote.id}/convert-invoice`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
    },
    onSuccess: () => handleRefresh(),
  })

  if (isLoading) return <PageLoading message="Loading CPQ workspace..." fullScreen={false} />

  if (!quotes.length && !error) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-16 text-center">
            <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No quotes yet</p>
            <p className="text-sm text-slate-500 mb-6">Load guided demo quotes to showcase configure, pricing, approval, and send workflow.</p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={seedMutation.isPending}
                onClick={() => seedMutation.mutate()}
                title={seedMutation.isPending ? 'Seeding demo quotes...' : 'Add demo CPQ records'}
              >
                {seedMutation.isPending ? 'Seeding Demo Quotes...' : 'Seed Demo Quotes'}
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
      {error ? (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Failed to load quotes. Please refresh.
        </div>
      ) : null}
      {seedMessage ? (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {seedMessage}
        </div>
      ) : null}

      <CPQHeader selectedQuote={selectedQuote} onRefresh={() => refetch()} />
      <QuoteHealthBanner healthScore={healthScore} healthChecks={healthChecks} />
      <CPQProgressStrip healthChecks={healthChecks} />

      <CPQMainGrid
        catalogSearch={catalogSearch}
        onCatalogSearchChange={setCatalogSearch}
        filteredCatalog={filteredCatalog}
        approvalRequired={approvalRequired}
        approvalReason={approvalReason}
        draftLineItems={draftLineItems}
        onQtyChange={(id, qty) => {
          setDraftLineItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)))
        }}
        pricing={pricing}
        margin={margin}
        selectedQuote={selectedQuote}
        approvalNote={approvalNote}
        rejectReason={rejectReason}
        onApprovalNoteChange={setApprovalNote}
        onRejectReasonChange={setRejectReason}
        onApprove={() => approveMutation.mutate('approved')}
        onReject={() => approveMutation.mutate('rejected')}
        onConvert={() => convertMutation.mutate()}
        isApproving={approveMutation.isPending}
        isConverting={convertMutation.isPending}
      />

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 space-y-4">
          <CPQTabs activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === 'builder' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Builder focuses on configuration + line items. Use inline quantity edits to see live total changes.
            </div>
          ) : null}
          {activeTab === 'pricing' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Pricing rules applied: GST 18%, negotiated discounts, and recurring/one-time split.
            </div>
          ) : null}
          {activeTab === 'approvals' ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Approval matrix checks discount and total thresholds before send.
            </div>
          ) : null}
          {activeTab === 'document' ? (
            <div data-testid="cpq-document-preview" className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-600 dark:text-slate-300">
              Document Preview loads on demand. Generate customer-facing PDF with version, language, and web quote link.
            </div>
          ) : null}
          {activeTab === 'history' ? <VersionHistoryPanel quotes={quotes} /> : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4">
          {quotes.map((q) => (
            <button
              key={q.id}
              type="button"
              className={`text-left rounded-xl border px-3 py-2 transition ${selectedQuote?.id === q.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
              onClick={() => setSelectedQuoteId(q.id)}
            >
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.deal?.name ?? 'Quote'}</p>
              <p className="text-xs text-slate-500">{q.quoteNumber ?? q.id.slice(0, 8)} - {formatINR(q.total)}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { AlertCircle, CheckCircle2, Calculator, Clock3, Download, FileText, RefreshCw, Send, ShieldAlert, Sparkles } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'

type QuoteLineItem = {
  id?: string
  productName?: string
  description?: string
  quantity: number
  unit_price?: number
  unitPrice?: number
  discount?: number
  total?: number
}

type Quote = {
  id: string
  quoteNumber?: string
  dealId?: string
  deal?: { id: string; name: string; stage?: string; value?: number }
  contact?: { id: string; name: string; email: string }
  status: string
  subtotal: number
  discount: number
  tax: number
  total: number
  validUntil?: string | null
  notes?: string | null
  lineItems: QuoteLineItem[]
  approver?: { name: string } | null
  approvedAt?: string | null
  approvalNote?: string | null
  invoiceId?: string | null
  createdAt: string
}

type QuotesApiPayload = {
  quotes?: Array<Record<string, any>>
}

type DraftLineItem = {
  id: string
  item: string
  description: string
  qty: number
  unitPrice: number
  discountRate: number
  taxRate: number
  badge?: 'recommended' | 'required' | 'incompatible'
}

type WorkspaceTab = 'builder' | 'pricing' | 'approvals' | 'document' | 'history'

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  converted: 'bg-purple-100 text-purple-700',
}

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'builder', label: 'Builder' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'document', label: 'Document Preview' },
  { id: 'history', label: 'History' },
]

const PRODUCT_CATALOG = [
  'Enterprise License',
  'Growth License',
  'Onboarding Pack',
  'Priority Support',
  'Success Manager',
  'Data Migration',
  'Analytics Add-on',
  'API Integrations',
  'Training Workshop',
  'Compliance Review',
  'Implementation Sprint',
]

function formatINR(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

function normalizeQuote(raw: Record<string, any>): Quote {
  return {
    id: raw.id,
    quoteNumber: raw.quoteNumber ?? raw.quote_number,
    dealId: raw.dealId ?? raw.deal_id,
    deal: raw.deal,
    contact: raw.contact,
    status: raw.status ?? 'draft',
    subtotal: Number(raw.subtotal ?? 0),
    discount: Number(raw.discount ?? 0),
    tax: Number(raw.tax ?? 0),
    total: Number(raw.total ?? 0),
    validUntil: raw.validUntil ?? raw.valid_until ?? null,
    notes: raw.notes ?? null,
    lineItems: Array.isArray(raw.lineItems) ? raw.lineItems : Array.isArray(raw.line_items) ? raw.line_items : [],
    approver: raw.approver ?? null,
    approvedAt: raw.approvedAt ?? raw.approved_at ?? null,
    approvalNote: raw.approvalNote ?? raw.approver_note ?? null,
    invoiceId: raw.invoiceId ?? raw.invoice_id ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  }
}

function quoteToDraftItems(quote: Quote | null): DraftLineItem[] {
  if (!quote) return []
  return quote.lineItems.map((li, index) => {
    const unitPrice = Number(li.unitPrice ?? li.unit_price ?? 0)
    const qty = Number(li.quantity ?? 1)
    const base = unitPrice * qty
    const discountRate = base > 0 ? Math.min(0.9, Number(li.discount ?? 0) / base) : 0
    return {
      id: li.id ?? `${quote.id}-${index}`,
      item: li.productName ?? li.description ?? `Line Item ${index + 1}`,
      description: li.description ?? li.productName ?? 'Configured service',
      qty,
      unitPrice,
      discountRate,
      taxRate: 0.18,
      badge: index === 0 ? 'required' : index === 1 ? 'recommended' : undefined,
    }
  })
}

export default function CPQPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const queryClient = useQueryClient()

  const [seedMessage, setSeedMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('builder')
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [draftLineItems, setDraftLineItems] = useState<DraftLineItem[]>([])
  const [approvalNote, setApprovalNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(catalogSearch), 220)
    return () => clearTimeout(timer)
  }, [catalogSearch])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['v1-quotes', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/quotes')
      if (!res.ok) throw new Error('Failed to load quotes')
      const payload = (await res.json()) as QuotesApiPayload
      return {
        ...payload,
        quotes: Array.isArray(payload.quotes) ? payload.quotes.map(normalizeQuote) : [],
      }
    },
    enabled: !!tenantId,
  })

  const quotes: Quote[] = data?.quotes ?? []
  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === selectedQuoteId) ?? quotes[0] ?? null,
    [quotes, selectedQuoteId]
  )

  useEffect(() => {
    if (quotes.length > 0 && !selectedQuoteId) {
      setSelectedQuoteId(quotes[0].id)
    }
  }, [quotes, selectedQuoteId])

  useEffect(() => {
    setDraftLineItems(quoteToDraftItems(selectedQuote))
  }, [selectedQuote?.id])

  const pricing = useMemo(() => {
    const subtotal = draftLineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
    const discount = draftLineItems.reduce((sum, li) => sum + li.qty * li.unitPrice * li.discountRate, 0)
    const taxable = subtotal - discount
    const tax = draftLineItems.reduce((sum, li) => {
      const lineBase = li.qty * li.unitPrice * (1 - li.discountRate)
      return sum + lineBase * li.taxRate
    }, 0)
    const total = taxable + tax
    const recurringTotal = draftLineItems.reduce((sum, li) => {
      if (li.item.toLowerCase().includes('license') || li.item.toLowerCase().includes('support')) {
        return sum + li.qty * li.unitPrice * (1 - li.discountRate)
      }
      return sum
    }, 0)
    const oneTimeTotal = Math.max(0, total - recurringTotal)
    return { subtotal, discount, tax, total, recurringTotal, oneTimeTotal }
  }, [draftLineItems])

  const margin = useMemo(() => {
    const listPrice = pricing.subtotal
    const soldPrice = pricing.total
    const discountPct = listPrice > 0 ? (pricing.discount / listPrice) * 100 : 0
    const estimatedCost = soldPrice * 0.63
    const marginPct = soldPrice > 0 ? ((soldPrice - estimatedCost) / soldPrice) * 100 : 0
    return { listPrice, soldPrice, discountPct, marginPct }
  }, [pricing])

  const approvalRequired = pricing.total > 250000 || margin.discountPct > 15
  const approvalReason = pricing.total > 250000 ? 'Quote value above ₹2.5L threshold' : 'Discount above 15%'

  const healthChecks = {
    context: !!selectedQuote?.contact && !!selectedQuote?.deal,
    configure: draftLineItems.length > 0,
    pricing: pricing.total > 0,
    approval: !approvalRequired || ['approved', 'accepted', 'converted'].includes(selectedQuote?.status ?? ''),
    send: ['sent', 'accepted', 'converted'].includes(selectedQuote?.status ?? ''),
  }
  const healthScore = Object.values(healthChecks).filter(Boolean).length

  const filteredCatalog = useMemo(() => {
    const filtered = PRODUCT_CATALOG.filter((p) => p.toLowerCase().includes(debouncedSearch.toLowerCase()))
    return filtered.slice(0, 8)
  }, [debouncedSearch])

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['v1-quotes', tenantId] })
  }

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/v1/quotes/seed', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? 'Failed to seed demo quotes')
      return body as { message?: string }
    },
    onSuccess: (body) => {
      setSeedMessage(body.message ?? 'Demo quotes added successfully.')
      handleRefresh()
    },
    onError: (e) => {
      setSeedMessage(e instanceof Error ? e.message : 'Could not seed demo quotes right now.')
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (decision: 'approved' | 'rejected') => {
      if (!selectedQuote) return
      await apiRequest(`/api/v1/quotes/${selectedQuote.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          approver_note: approvalNote,
          reason: rejectReason,
        }),
      })
    },
    onSuccess: () => {
      setApprovalNote('')
      setRejectReason('')
      handleRefresh()
    },
  })

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) return
      await apiRequest(`/api/v1/quotes/${selectedQuote.id}/convert-invoice`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
    },
    onSuccess: () => handleRefresh(),
  })

  if (isLoading) return <PageLoading message="Loading CPQ workspace..." fullScreen={false} />

  if (!quotes.length && !error) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-16 text-center">
            <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No quotes yet</p>
            <p className="text-sm text-slate-500 mb-6">Load guided demo quotes to showcase configure, pricing, approval, and send workflow.</p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={seedMutation.isPending}
                onClick={() => seedMutation.mutate()}
                title={seedMutation.isPending ? 'Seeding demo quotes...' : 'Add demo CPQ records'}
              >
                {seedMutation.isPending ? 'Seeding Demo Quotes...' : 'Seed Demo Quotes'}
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to load quotes. Please refresh.
        </div>
      )}
      {seedMessage && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {seedMessage}
        </div>
      )}

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-header">
        <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {selectedQuote?.deal?.name ?? 'Configure-Price-Quote Workspace'}
              </h1>
              <Badge className={STATUS_COLOR[selectedQuote?.status ?? 'draft'] ?? STATUS_COLOR.draft}>
                {(selectedQuote?.status ?? 'draft').replace('_', ' ')}
              </Badge>
              {selectedQuote?.quoteNumber ? (
                <Badge variant="outline">#{selectedQuote.quoteNumber}</Badge>
              ) : null}
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap gap-3">
              <span>Customer: {selectedQuote?.contact?.name ?? 'N/A'}</span>
              <span>Deal stage: {selectedQuote?.deal?.stage ?? 'proposal'}</span>
              <span>Valid until: {selectedQuote?.validUntil ? format(new Date(selectedQuote.validUntil), 'dd MMM yyyy') : 'Not set'}</span>
              <span>Owner: Revenue Team</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-1" /> Preview
            </Button>
            <Button variant="outline" size="sm" disabled={!selectedQuote}>
              <Clock3 className="w-4 h-4 mr-1" /> Request Approval
            </Button>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" disabled={!selectedQuote}>
              <Send className="w-4 h-4 mr-1" /> Send Quote
            </Button>
            <Button variant="outline" size="sm">More</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-health-banner">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quote Health Indicator</p>
            <p className="text-xs text-slate-500">
              {healthScore}/5 checks complete - {healthChecks.send ? 'ready to send' : 'needs final action before sending'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge variant={healthChecks.context ? 'default' : 'outline'}>Context</Badge>
            <Badge variant={healthChecks.configure ? 'default' : 'outline'}>Configure</Badge>
            <Badge variant={healthChecks.pricing ? 'default' : 'outline'}>Pricing</Badge>
            <Badge variant={healthChecks.approval ? 'default' : 'outline'}>Approval</Badge>
            <Badge variant={healthChecks.send ? 'default' : 'outline'}>Send</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          ['Context', healthChecks.context],
          ['Configure', healthChecks.configure],
          ['Pricing', healthChecks.pricing],
          ['Approval', healthChecks.approval],
          ['Send', healthChecks.send],
        ].map(([label, done]) => (
          <Card key={String(label)} className="rounded-2xl border-slate-200/80 dark:border-slate-800">
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
              {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock3 className="w-4 h-4 text-amber-600" />}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section className="xl:col-span-4 space-y-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-config-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Configuration Studio</CardTitle>
              <CardDescription>Configure the commercial package with rule hints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Product Catalog Search</p>
                <Input
                  placeholder="Search products, bundles, add-ons..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
                <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                  {filteredCatalog.map((p) => (
                    <div key={p} className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 flex items-center justify-between">
                      <span>{p}</span>
                      <Badge variant="outline" className="text-[10px]">add-on</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">Packages & Terms</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">Base Plan</Button>
                  <Button variant="outline" size="sm">Add-ons</Button>
                  <Button variant="outline" size="sm">Services</Button>
                  <Button variant="outline" size="sm">Contract Terms</Button>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-semibold mb-1">Rule Validation</p>
                <p>{approvalRequired ? `Approval required: ${approvalReason}.` : 'No blocking configuration rules found.'}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="xl:col-span-5 space-y-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quote Builder</CardTitle>
              <CardDescription>Inline-edit quantity and see totals update instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-testid="cpq-line-items">
              <div className="overflow-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Discount</th>
                      <th className="text-right py-2">Tax</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftLineItems.map((li) => {
                      const lineBase = li.qty * li.unitPrice
                      const lineDiscount = lineBase * li.discountRate
                      const lineTax = (lineBase - lineDiscount) * li.taxRate
                      const lineTotal = lineBase - lineDiscount + lineTax
                      return (
                        <tr key={li.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <span>{li.item}</span>
                              {li.badge ? <Badge variant="outline" className="text-[10px]">{li.badge}</Badge> : null}
                            </div>
                          </td>
                          <td className="py-2 text-xs text-slate-500">{li.description}</td>
                          <td className="py-2 text-right">
                            <Input
                              type="number"
                              className="h-8 w-20 ml-auto text-right"
                              value={li.qty}
                              onChange={(e) => {
                                const next = Math.max(1, Number(e.target.value) || 1)
                                setDraftLineItems((prev) => prev.map((p) => (p.id === li.id ? { ...p, qty: next } : p)))
                              }}
                            />
                          </td>
                          <td className="py-2 text-right">{formatINR(li.unitPrice)}</td>
                          <td className="py-2 text-right">{(li.discountRate * 100).toFixed(1)}%</td>
                          <td className="py-2 text-right">{(li.taxRate * 100).toFixed(0)}%</td>
                          <td className="py-2 text-right font-medium">{formatINR(lineTotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-pricing-breakdown">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pricing Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(pricing.subtotal)}</span></div>
                <div className="flex justify-between"><span>Discounts</span><span>-{formatINR(pricing.discount)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatINR(pricing.tax)}</span></div>
                <div className="flex justify-between"><span>Recurring</span><span>{formatINR(pricing.recurringTotal)}</span></div>
                <div className="flex justify-between"><span>One-time</span><span>{formatINR(pricing.oneTimeTotal)}</span></div>
                <div className="flex justify-between font-semibold pt-1 border-t"><span>Grand Total</span><span>{formatINR(pricing.total)}</span></div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-margin-analysis">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Margin Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between"><span>List Price</span><span>{formatINR(margin.listPrice)}</span></div>
                <div className="flex justify-between"><span>Sold Price</span><span>{formatINR(margin.soldPrice)}</span></div>
                <div className="flex justify-between"><span>Discount %</span><span>{margin.discountPct.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span>Margin %</span><span>{margin.marginPct.toFixed(1)}%</span></div>
                <div className="pt-2">
                  <Badge className={approvalRequired ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                    {approvalRequired ? 'Approval threshold triggered' : 'Within policy range'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="xl:col-span-3 space-y-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-approval-status">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Deal & Approval Rail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2">
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-medium">{selectedQuote?.contact?.name ?? 'N/A'}</p>
                <p className="text-xs text-slate-500">{selectedQuote?.contact?.email ?? 'No email linked'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2">
                <p className="text-xs text-slate-500">Approval State</p>
                <p className="font-medium">{approvalRequired ? 'Approval Required' : 'No Approval Required'}</p>
                <p className="text-xs text-slate-500">{approvalRequired ? approvalReason : 'Auto-clear for sending'}</p>
              </div>
              <Input
                placeholder="Approver note"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
              <Input
                placeholder="Rejection reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  disabled={!selectedQuote || approveMutation.isPending}
                  onClick={() => approveMutation.mutate('approved')}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!selectedQuote || approveMutation.isPending}
                  onClick={() => approveMutation.mutate('rejected')}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="col-span-2"
                  disabled={!selectedQuote || convertMutation.isPending}
                  onClick={() => convertMutation.mutate()}
                >
                  Convert to Invoice
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" /> PDF</Button>
                <Button size="sm" variant="outline"><Send className="w-4 h-4 mr-1" /> Web Quote</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-ai-assistant">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AI Quote Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /> Suggested upsell: add onboarding sprint for faster go-live.</p>
              <p className="flex items-start gap-2"><ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /> Discount risk: current quote is {margin.discountPct.toFixed(1)}% below list.</p>
              <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Tax and pricing totals are internally consistent.</p>
            </CardContent>
          </Card>
        </section>
      </div>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === 'builder' && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Builder focuses on configuration + line items. Use inline quantity edits to see live total changes.
            </div>
          )}
          {activeTab === 'pricing' && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Pricing rules applied: GST 18%, negotiated discounts, and recurring/one-time split.
            </div>
          )}
          {activeTab === 'approvals' && (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Approval matrix checks discount and total thresholds before send.
            </div>
          )}
          {activeTab === 'document' && (
            <div data-testid="cpq-document-preview" className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-600 dark:text-slate-300">
              Document Preview loads on demand. Generate customer-facing PDF with version, language, and web quote link.
            </div>
          )}
          {activeTab === 'history' && (
            <div data-testid="cpq-version-history" className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
              {quotes.slice(0, 5).map((q) => (
                <div key={q.id} className="flex items-center justify-between text-xs">
                  <span>{q.quoteNumber ?? q.id.slice(0, 8)}</span>
                  <span className="text-slate-500">{q.status}</span>
                  <span className="text-slate-400">{format(new Date(q.createdAt), 'dd MMM yyyy')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quote Selector</CardTitle>
          <CardDescription>Switch between existing quotes during demos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {quotes.map((q) => (
            <button
              key={q.id}
              type="button"
              className={`text-left rounded-xl border px-3 py-2 transition ${selectedQuote?.id === q.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
              onClick={() => setSelectedQuoteId(q.id)}
            >
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.deal?.name ?? 'Quote'}</p>
              <p className="text-xs text-slate-500">{q.quoteNumber ?? q.id.slice(0, 8)} - {formatINR(q.total)}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
