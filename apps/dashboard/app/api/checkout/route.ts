import { NextRequest, NextResponse } from 'next/server'
import { createOrder as createRazorpayOrder, getRazorpayClient } from '@/lib/payments/razorpay'
import { createOrder as createPayaidOrder, isPayAidConfigured } from '@/lib/payments/payaid'

export type CheckoutGateway = 'payaid' | 'razorpay' | 'stripe'

/**
 * POST /api/checkout?gateway=payaid|razorpay|stripe
 * Body: { amount (paise), receipt, currency?, notes? }
 * Returns: { orderId, amount, currency, gateway, keyId? } for client.
 * Default gateway: payaid (primary PG).
 */
export async function POST(req: NextRequest) {
  const gateway = (req.nextUrl.searchParams.get('gateway') || 'payaid') as CheckoutGateway
  try {
    const body = await req.json()
    const amount = Number(body?.amount)
    const receipt = typeof body?.receipt === 'string' ? body.receipt : undefined
    if (!receipt || !Number.isInteger(amount) || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid body: amount (paise, min 100) and receipt required.' },
        { status: 400 }
      )
    }
    const params = {
      amount,
      currency: body.currency || 'INR',
      receipt,
      notes: body.notes ?? {},
    }

    if (gateway === 'payaid') {
      if (!isPayAidConfigured()) {
        return NextResponse.json({ error: 'PayAid not configured' }, { status: 503 })
      }
      const result = await createPayaidOrder(params)
      if (!result) return NextResponse.json({ error: 'Failed to create order' }, { status: 502 })
      return NextResponse.json({ ...result, gateway: 'payaid' })
    }

    if (gateway === 'razorpay') {
      if (!getRazorpayClient()) {
        return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 })
      }
      const result = await createRazorpayOrder(params)
      if (!result) return NextResponse.json({ error: 'Failed to create order' }, { status: 502 })
      return NextResponse.json({
        ...result,
        gateway: 'razorpay',
        keyId: process.env.RAZORPAY_KEY_ID,
      })
    }

    if (gateway === 'stripe') {
      // TODO: Stripe Payment Intents or Checkout Session; return client_secret or sessionId
      return NextResponse.json(
        { error: 'Stripe integration pending. Use gateway=payaid or gateway=razorpay.' },
        { status: 501 }
      )
    }

    return NextResponse.json({ error: 'Unknown gateway. Use payaid|razorpay|stripe' }, { status: 400 })
  } catch (e) {
    console.error('[checkout] error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
