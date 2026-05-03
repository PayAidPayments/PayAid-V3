import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { QuotesApiPayload, Quote } from '../components/types'
import { normalizeQuote, quoteToDraftItems } from '../components/utils'
import type { CatalogEntry } from '../lib/catalog'
import { CPQ_CATALOG_ENTRIES } from '../lib/catalog'
import { draftLineItemsToPatchPayload } from '../lib/draft-to-api'
import { getCanSendQuote, getSendQuoteTooltip, isApprovalGateCleared } from '../lib/quote-action-state'

export function useCPQWorkspace(tenantId: string) {
  const queryClient = useQueryClient()

  const [seedMessage, setSeedMessage] = useState<string | null>(null)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [draftLineItems, setDraftLineItems] = useState<ReturnType<typeof quoteToDraftItems>>([])
  const [approvalNote, setApprovalNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [documentFeedback, setDocumentFeedback] = useState<string | null>(null)

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

  const quotes: Quote[] = useMemo(() => data?.quotes ?? [], [data?.quotes])
  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === selectedQuoteId) ?? quotes[0] ?? null,
    [quotes, selectedQuoteId]
  )

  useEffect(() => {
    if (quotes.length === 0 || selectedQuoteId) return
    const id = globalThis.setTimeout(() => {
      setSelectedQuoteId(quotes[0].id)
    }, 0)
    return () => globalThis.clearTimeout(id)
  }, [quotes, selectedQuoteId])

  useEffect(() => {
    setDocumentFeedback(null)
  }, [selectedQuoteId])

  useEffect(() => {
    const next = quoteToDraftItems(selectedQuote)
    const id = globalThis.setTimeout(() => {
      setDraftLineItems(next)
    }, 0)
    return () => globalThis.clearTimeout(id)
  }, [selectedQuote])

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
    approval: isApprovalGateCleared(approvalRequired, selectedQuote?.status),
    send: ['sent', 'accepted', 'converted'].includes(selectedQuote?.status ?? ''),
  }
  const healthScore = Object.values(healthChecks).filter(Boolean).length

  const canSendQuote = useMemo(
    () =>
      getCanSendQuote({
        selectedQuote,
        draftLineCount: draftLineItems.length,
        pricingTotal: pricing.total,
        approvalRequired,
      }),
    [approvalRequired, draftLineItems.length, pricing.total, selectedQuote]
  )

  const sendQuoteTooltip = useMemo(
    () => getSendQuoteTooltip({ selectedQuote, canSend: canSendQuote, approvalRequired }),
    [approvalRequired, canSendQuote, selectedQuote]
  )

  const filteredCatalog = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return CPQ_CATALOG_ENTRIES.filter(
      (e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [debouncedSearch])

  const addCatalogLine = useCallback((entry: CatalogEntry) => {
    const id = `cat-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
    setDraftLineItems((prev) => [
      ...prev,
      {
        id,
        item: entry.name,
        description: entry.description,
        qty: 1,
        unitPrice: entry.defaultUnitPrice,
        discountRate: 0,
        taxRate: 0.18,
        badge: 'recommended',
      },
    ])
  }, [])

  const refreshQuotes = () => {
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
      refreshQuotes()
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
      refreshQuotes()
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
    onSuccess: () => refreshQuotes(),
  })

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) throw new Error('No quote selected')
      if (draftLineItems.length === 0) throw new Error('Add at least one line item')
      const res = await apiRequest(`/api/v1/quotes/${selectedQuote.id}`, {
        method: 'PATCH',
        body: JSON.stringify(draftLineItemsToPatchPayload(draftLineItems)),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to save quote')
    },
    onSuccess: () => refreshQuotes(),
  })

  const requestApprovalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) throw new Error('No quote selected')
      if (draftLineItems.length === 0) throw new Error('Add at least one line item')
      const patch = await apiRequest(`/api/v1/quotes/${selectedQuote.id}`, {
        method: 'PATCH',
        body: JSON.stringify(draftLineItemsToPatchPayload(draftLineItems)),
      })
      const patchBody = await patch.json().catch(() => ({}))
      if (!patch.ok) {
        throw new Error(typeof patchBody?.error === 'string' ? patchBody.error : 'Failed to save before request')
      }
      const req = await apiRequest(`/api/v1/quotes/${selectedQuote.id}/request-approval`, {
        method: 'POST',
      })
      const reqBody = await req.json().catch(() => ({}))
      if (!req.ok) {
        throw new Error(
          typeof reqBody?.error === 'string' ? reqBody.error : 'Request approval failed'
        )
      }
    },
    onSuccess: () => refreshQuotes(),
  })

  const sendQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) throw new Error('No quote selected')
      if (draftLineItems.length === 0) throw new Error('Add at least one line item')
      const patch = await apiRequest(`/api/v1/quotes/${selectedQuote.id}`, {
        method: 'PATCH',
        body: JSON.stringify(draftLineItemsToPatchPayload(draftLineItems)),
      })
      const patchBody = await patch.json().catch(() => ({}))
      if (!patch.ok) {
        throw new Error(typeof patchBody?.error === 'string' ? patchBody.error : 'Failed to save before send')
      }
      const send = await apiRequest(`/api/v1/quotes/${selectedQuote.id}/send`, { method: 'POST' })
      const sendBody = await send.json().catch(() => ({}))
      if (!send.ok) {
        const msg =
          typeof sendBody?.error === 'string' ? sendBody.error : send.status === 422 ? 'Send blocked by policy' : 'Failed to send quote'
        throw new Error(msg)
      }
    },
    onSuccess: () => refreshQuotes(),
  })

  const documentMutation = useMutation({
    mutationFn: async (channel: 'pdf' | 'web') => {
      if (!selectedQuote) throw new Error('No quote selected')
      const res = await apiRequest(`/api/v1/quotes/${selectedQuote.id}/document`, {
        method: 'POST',
        body: JSON.stringify({ channel }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof body?.error === 'string' ? body.error : 'Document request failed')
      return body as { message?: string; channel?: string }
    },
    onSuccess: (data) => {
      setDocumentFeedback(data.message ?? 'Document request recorded.')
    },
  })

  return {
    seedMessage,
    catalogSearch,
    setCatalogSearch,
    filteredCatalog,
    addCatalogLine,
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
    canSendQuote,
    sendQuoteTooltip,
    isLoading,
    error,
    refetch,
    seedMutation,
    approveMutation,
    convertMutation,
    saveDraftMutation,
    requestApprovalMutation,
    sendQuoteMutation,
    documentMutation,
    documentFeedback,
  }
}
