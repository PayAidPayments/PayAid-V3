'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { formatINR } from '@/lib/utils/formatINR'

type LineRow = {
  id: string
  productName: string
  description: string | null
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

type QuotePayload = {
  quoteNumber: string
  status: string
  subtotal: number
  discount: number
  tax: number
  total: number
  validUntil: string | null
  notes: string | null
  deal: { name: string; stage?: string } | null
  contact: { name: string; email: string } | null
  lineItems: LineRow[]
}

export default function QuotePreviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const quoteId = params?.quoteId as string
  const [quote, setQuote] = useState<QuotePayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quoteId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/crm/cpq/quotes/${quoteId}`, { headers: getAuthHeaders() })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to load quote')
        }
        const q = body.quote as QuotePayload
        if (!cancelled) setQuote(q)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load quote')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [quoteId])

  useEffect(() => {
    if (!quote || searchParams.get('print') !== '1') return
    const t = globalThis.setTimeout(() => globalThis.print(), 500)
    return () => globalThis.clearTimeout(t)
  }, [quote, searchParams])

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-red-700" data-testid="cpq-quote-preview-error">
        {error}
      </div>
    )
  }

  if (!quote) {
    return <PageLoading message="Loading quote preview..." fullScreen={false} />
  }

  return (
    <div
      className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6 print:py-4"
      data-testid="cpq-quote-preview"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-slate-500">Customer-facing preview (internal). Use print to save as PDF.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => globalThis.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <header className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Quote {quote.quoteNumber}</h1>
        <p className="text-sm text-slate-500 mt-1">Status: {quote.status.replace(/_/g, ' ')}</p>
      </header>

      <section className="text-sm space-y-1">
        <p>
          <span className="text-slate-500">Customer: </span>
          {quote.contact?.name ?? '—'}
        </p>
        {quote.contact?.email ? (
          <p>
            <span className="text-slate-500">Email: </span>
            {quote.contact.email}
          </p>
        ) : null}
        <p>
          <span className="text-slate-500">Deal: </span>
          {quote.deal?.name ?? '—'}
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Line items</h2>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-left">
                <th className="p-3 font-medium">Item</th>
                <th className="p-3 font-medium text-right">Qty</th>
                <th className="p-3 font-medium text-right">Unit</th>
                <th className="p-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((li) => (
                <tr key={li.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{li.productName}</div>
                    {li.description ? (
                      <div className="text-xs text-slate-500 mt-0.5">{li.description}</div>
                    ) : null}
                  </td>
                  <td className="p-3 text-right tabular-nums">{li.quantity}</td>
                  <td className="p-3 text-right tabular-nums">{formatINR(li.unitPrice)}</td>
                  <td className="p-3 text-right tabular-nums font-medium">{formatINR(li.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="text-sm space-y-1 border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex justify-between">
          <span className="text-slate-500">Subtotal</span>
          <span className="tabular-nums">{formatINR(quote.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Discounts</span>
          <span className="tabular-nums">−{formatINR(quote.discount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tax</span>
          <span className="tabular-nums">{formatINR(quote.tax)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold pt-2">
          <span>Total</span>
          <span className="tabular-nums">{formatINR(quote.total)}</span>
        </div>
      </section>

      {quote.notes ? (
        <section className="text-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Notes</h2>
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{quote.notes}</p>
        </section>
      ) : null}
    </div>
  )
}
