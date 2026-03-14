'use client'

import { useState, useCallback } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  handler: (res: { razorpay_payment_id: string; razorpay_order_id: string }) => void
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color: string }
}

export default function RazorpayCheckoutPage() {
  const [amountRupees, setAmountRupees] = useState('500')
  const [receipt, setReceipt] = useState('receipt-' + Date.now())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  const openCheckout = useCallback(async () => {
    setError(null)
    const paise = Math.round(parseFloat(amountRupees || '0') * 100)
    if (paise < 100) {
      setError('Amount must be at least ₹1')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paise,
          receipt: receipt || `receipt-${Date.now()}`,
          currency: 'INR',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create order')
        return
      }
      const { orderId, keyId, amount, currency } = data
      if (!scriptReady || !window.Razorpay) {
        setError('Razorpay script not loaded. Refresh and try again.')
        return
      }
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'PayAid',
        description: 'Payment for order ' + receipt,
        handler(response: { razorpay_payment_id: string; razorpay_order_id: string }) {
          console.log('Payment success:', response.razorpay_payment_id)
          setError(null)
          alert('Payment successful. ID: ' + response.razorpay_payment_id)
        },
        theme: { color: '#0ea5e9' },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [amountRupees, receipt, scriptReady])

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/razorpay.js"
        onLoad={() => setScriptReady(true)}
      />
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold">Razorpay Checkout</h1>
        <p className="mt-1 text-sm text-slate-500">
          Minimal demo: create order via API, open Razorpay modal.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Amount (₹)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Receipt</label>
            <input
              type="text"
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="button"
            onClick={openCheckout}
            disabled={loading || !scriptReady}
            className="w-full rounded bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? 'Creating order…' : scriptReady ? 'Pay with Razorpay' : 'Loading…'}
          </button>
        </div>
      </main>
    </>
  )
}
