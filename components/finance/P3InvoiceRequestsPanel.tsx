'use client'

/**
 * P3 Finance invoice thin operator surface.
 * Uses /api/finance/invoices/slice only — no GST rebuild, no live send, no new gateway.
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Plus, RefreshCw } from 'lucide-react'

type ProductStatus = 'draft' | 'issued' | 'paid' | 'cancelled'

interface SliceInvoice {
  id: string
  invoiceNumber: string
  status: ProductStatus
  dbStatus?: string
  customerId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  total: number
  currency: string
  paidAt?: string | null
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return map[status] || map.draft
}

function nextActions(status: ProductStatus): ProductStatus[] {
  if (status === 'draft') return ['issued', 'cancelled']
  if (status === 'issued') return ['paid', 'cancelled']
  return []
}

export function P3InvoiceRequestsPanel({ customerId }: { customerId?: string }) {
  const { token } = useAuthStore()
  const [items, setItems] = useState<SliceInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('1000')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams({ limit: '50' })
      if (customerId) q.set('customerId', customerId)
      const res = await fetch(`/api/finance/invoices/slice?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`)
      setItems(Array.isArray(data.invoices) ? data.invoices : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, customerId])

  useEffect(() => {
    void load()
  }, [load])

  const createDraft = async () => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const amt = Number(amount)
      if (!Number.isFinite(amt) || amt <= 0) throw new Error('Amount must be a positive number')
      const body: Record<string, unknown> = {
        amount: amt,
        notes: 'P3 thin UI invoice',
      }
      if (customerId) body.customerId = customerId
      else {
        if (!name.trim()) throw new Error('Customer name is required')
        body.customerName = name.trim()
        if (email.trim()) body.customerEmail = email.trim()
      }
      const res = await fetch('/api/finance/invoices/slice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Create failed (${res.status})`)
      setName('')
      setEmail('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (invoiceId: string, status: ProductStatus) => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/finance/invoices/slice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'status', invoiceId, status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Status update failed (${res.status})`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">New draft invoice</h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Mark-paid only — no new payment gateway. No live send.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || saving}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!customerId && (
            <>
              <label className="text-xs text-slate-600 dark:text-gray-300 space-y-1">
                <span>Customer name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                  placeholder="Acme Corp"
                />
              </label>
              <label className="text-xs text-slate-600 dark:text-gray-300 space-y-1">
                <span>Email (optional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                  placeholder="billing@acme.com"
                />
              </label>
            </>
          )}
          <label className="text-xs text-slate-600 dark:text-gray-300 space-y-1">
            <span>Amount</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
            />
          </label>
        </div>

        <Button onClick={() => void createDraft()} disabled={saving || loading}>
          <Plus className="w-4 h-4 mr-1" />
          Create draft
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-4">Invoices</h2>
        {loading ? (
          <PageLoading message="Loading invoices..." fullScreen={false} />
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-gray-400">No invoices yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-gray-100">
                      {item.invoiceNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                    {item.customerName || 'No customer'} · {item.currency} {Number(item.total).toFixed(2)}
                    {item.paidAt ? ` · paid ${String(item.paidAt).slice(0, 10)}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nextActions(item.status).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => void setStatus(item.id, s)}
                    >
                      {s === 'paid' ? 'mark paid' : s}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
