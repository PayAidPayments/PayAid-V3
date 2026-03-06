'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, CreditCard, HelpCircle, Loader2 } from 'lucide-react'

interface InvoiceRow {
  id: string
  invoiceNumber: string
  status: string
  paymentStatus: string
  total: number
  dueDate: string | null
  createdAt: string
  hasPaymentLink: boolean
}

export default function CustomerPortalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tenantId = params.tenantId as string
  const customerId = params.customerId as string
  const token = searchParams.get('token')?.trim()

  const [loading, setLoading] = useState(!!token)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<{ id: string; name: string | null; email: string | null } | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [payingId, setPayingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Missing access token. Use the link from your invoice email.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/api/portal/invoices?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || 'Failed to load') })
        return res.json()
      })
      .then((data) => {
        setCustomer(data.customer)
        setInvoices(data.invoices || [])
      })
      .catch((e) => setError(e.message || 'Failed to load invoices'))
      .finally(() => setLoading(false))
  }, [token])

  const handlePay = async (invoiceId: string) => {
    if (!token) return
    setPayingId(invoiceId)
    try {
      const res = await fetch(`/api/portal/invoices/${invoiceId}/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get payment link')
      if (data.paymentLinkUrl) window.location.href = data.paymentLinkUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get payment link')
    } finally {
      setPayingId(null)
    }
  }

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Customer Portal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View invoices, pay online, and get support
          </p>
        </div>

        {!token && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="py-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Use the secure link from your invoice or email to access your invoices here.
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="py-6">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              My Invoices
            </CardTitle>
            <CardDescription>
              {customer ? `Invoices for ${customer.name || 'your account'}` : 'View and pay your invoices'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading invoices…
              </div>
            ) : invoices.length === 0 && !error ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No invoices found. New invoices will appear here when sent to you.
              </p>
            ) : (
              <ul className="space-y-3">
                {invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatINR(inv.total)} · Due {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {inv.paymentStatus === 'paid' ? 'Paid' : inv.status}
                      </span>
                      {inv.paymentStatus !== 'paid' && (
                        <Button
                          size="sm"
                          disabled={!!payingId}
                          onClick={() => handlePay(inv.id)}
                        >
                          {payingId === inv.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Pay'
                          )}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pay outstanding
            </CardTitle>
            <CardDescription>Pay via link or UPI</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Use the Pay button next to each invoice above to pay with UPI, card, or net banking.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Support
            </CardTitle>
            <CardDescription>Raise a ticket or contact us</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Need help? Contact the business that sent you this portal link.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
