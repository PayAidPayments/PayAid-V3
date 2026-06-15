'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRStandard } from '@/lib/utils/formatINR'

type InvoiceRow = {
  id: string
  status: string
  amount: number
  createdAt: string
}

export default function FinanceBillingPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Sign in via platform login to load billing data.')
      return
    }
    fetch('/api/billing/invoices?limit=20', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load invoices')
        return res.json()
      })
      .then((data) => {
        setInvoices(
          (data.invoices ?? []).map((inv: { id: string; status: string; amount: unknown; createdAt: string }) => ({
            id: inv.id,
            status: inv.status,
            amount: Number(inv.amount),
            createdAt: inv.createdAt,
          }))
        )
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-xl font-semibold">Billing</h1>
      <p className="text-sm text-slate-500">Tenant: {tenantId} · @payaid/domain-billing</p>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && invoices.length === 0 && (
        <p className="text-sm text-slate-500">No subscription invoices yet.</p>
      )}
      <ul className="divide-y border rounded-lg bg-white">
        {invoices.map((inv) => (
          <li key={inv.id} className="px-4 py-3 flex justify-between text-sm">
            <span>{inv.id.slice(0, 10)}…</span>
            <span className="capitalize">{inv.status}</span>
            <span>{formatINRStandard(inv.amount)}</span>
          </li>
        ))}
      </ul>
    </main>
  )
}
