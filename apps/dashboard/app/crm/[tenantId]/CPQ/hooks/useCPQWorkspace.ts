import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { PRODUCT_CATALOG } from '../components/constants'
import { QuotesApiPayload, Quote, WorkspaceTab } from '../components/types'
import { normalizeQuote, quoteToDraftItems } from '../components/utils'

export function useCPQWorkspace(tenantId: string) {
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

  return {
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
  }
}
