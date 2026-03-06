'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useDeal, getAuthHeaders } from '@/lib/hooks/use-api'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, ArrowLeft, FileText } from 'lucide-react'

type LineItem = {
  productId?: string | null
  productName: string
  description?: string
  quantity: number
  unitPrice: number
  discount?: number
}

type Product = {
  id: string
  name: string
  description?: string
  basePrice?: number
  sku?: string
}

export default function NewQuotePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  const dealId = searchParams.get('dealId') ?? ''

  const { data: deal, isLoading } = useDeal(dealId, tenantId)

  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productToAdd, setProductToAdd] = useState<string>('')

  const { data: existingQuoteId } = useQuery({
    queryKey: ['crm', 'quotes', 'existing-for-deal', dealId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/cpq/quotes?dealId=${encodeURIComponent(dealId)}`, { headers: getAuthHeaders() })
      if (!res.ok) return null
      const json = await res.json().catch(() => ({}))
      const quotes = Array.isArray(json.quotes) ? json.quotes : []
      return quotes[0]?.id ? String(quotes[0].id) : null
    },
    enabled: !!dealId,
  })

  const { data: productsData } = useQuery({
    queryKey: ['crm', 'cpq-products'],
    queryFn: async () => {
      const res = await fetch('/api/crm/cpq/products', { headers: getAuthHeaders() })
      if (!res.ok) return []
      const json = await res.json().catch(() => ({}))
      return (json.products || []) as Product[]
    },
  })
  const products = productsData ?? []

  useEffect(() => {
    // Prefill only once when deal loads
    if (!dealId || !deal) return
    setLineItems((prev) => {
      if (prev.length > 0) return prev
      return [
        {
          productName: deal.name ?? 'Deal item',
          quantity: 1,
          unitPrice: Number(deal.value ?? 0),
        },
      ]
    })
  }, [dealId, deal])

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, li) => s + Math.max(1, li.quantity) * (li.unitPrice || 0) - (li.discount || 0), 0)
    return { subtotal, total: Math.max(0, subtotal) }
  }, [lineItems])

  if (!dealId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Alert variant="warning">
          <AlertTitle>Missing deal</AlertTitle>
          <AlertDescription>
            Create a quote from a deal. Go to Deals and click “Create Quote”.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href={`/crm/${tenantId}/Deals`}>Go to Deals</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/crm/${tenantId}/Deals/${dealId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100 truncate">New Quote</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 truncate">
            From deal: {deal?.name ?? dealId}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Quote creation failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {existingQuoteId && (
        <Alert variant="info">
          <AlertTitle>Quote already exists</AlertTitle>
          <AlertDescription>
            This deal already has a quote. You can open it instead of creating another.
            <div className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href={`/crm/${tenantId}/Quotes/${existingQuoteId}`}>Open existing quote</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-base">Quote line items</CardTitle>
          <CardDescription>Review and adjust before saving.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>Add product (optional)</Label>
                  <select
                    value={productToAdd}
                    onChange={(e) => setProductToAdd(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    disabled={saving}
                  >
                    <option value="">Select a product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="outline"
                  disabled={saving || !productToAdd}
                  onClick={() => {
                    const p = products.find((x) => x.id === productToAdd)
                    if (!p) return
                    setLineItems((prev) => [
                      ...prev,
                      {
                        productId: p.id,
                        productName: p.name,
                        description: p.description,
                        quantity: 1,
                        unitPrice: Number(p.basePrice ?? 0),
                      },
                    ])
                    setProductToAdd('')
                  }}
                >
                  Add product
                </Button>
              </div>

              {lineItems.map((li, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Item</Label>
                      <Input
                        value={li.productName}
                        onChange={(e) => {
                          const v = e.target.value
                          setLineItems((prev) => prev.map((p, i) => (i === idx ? { ...p, productName: v } : p)))
                        }}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unit price</Label>
                      <Input
                        type="number"
                        value={li.unitPrice}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0)
                          setLineItems((prev) => prev.map((p, i) => (i === idx ? { ...p, unitPrice: v } : p)))
                        }}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        value={li.quantity}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value || 1))
                          setLineItems((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: v } : p)))
                        }}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Discount</Label>
                      <Input
                        type="number"
                        value={li.discount ?? 0}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value || 0))
                          setLineItems((prev) => prev.map((p, i) => (i === idx ? { ...p, discount: v } : p)))
                        }}
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving || lineItems.length <= 1}
                      onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                disabled={saving}
                onClick={() =>
                  setLineItems((prev) => [
                    ...prev,
                    { productName: 'Item', quantity: 1, unitPrice: 0 },
                  ])
                }
              >
                Add item
              </Button>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-500 dark:text-gray-400">Total</span>
                  <span className="font-semibold">₹{totals.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={saving}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild disabled={saving}>
          <Link href={`/crm/${tenantId}/Deals/${dealId}`}>Cancel</Link>
        </Button>
        <Button
          disabled={saving || lineItems.length === 0 || !!existingQuoteId}
          onClick={async () => {
            setError(null)
            setSaving(true)
            try {
              const res = await fetch('/api/crm/cpq/quotes', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  dealId,
                  contactId: deal?.contact?.id ?? deal?.contactId ?? undefined,
                  notes: notes.trim() || undefined,
                  lineItems: lineItems.map((li) => ({
                    productId: li.productId ?? null,
                    productName: li.productName,
                    description: li.description ?? null,
                    quantity: li.quantity,
                    unitPrice: li.unitPrice,
                    discount: li.discount ?? 0,
                  })),
                }),
              })
              const json = await res.json().catch(() => ({}))
              if (!res.ok) {
                if (res.status === 409 && json.quoteId) {
                  router.replace(`/crm/${tenantId}/Quotes/${json.quoteId}`)
                  return
                }
                throw new Error(json.error || json.message || 'Failed to create quote')
              }
              if (!json.quote?.id) {
                throw new Error('Quote created but no id returned')
              }
              router.replace(`/crm/${tenantId}/Quotes/${json.quote.id}`)
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to create quote')
            } finally {
              setSaving(false)
            }
          }}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Save Quote
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

