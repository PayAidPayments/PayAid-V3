import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getRazorpayClient } from '@/lib/payments/razorpay'

/**
 * POST /api/payments/razorpay – Create Razorpay order (UPI/cards/PayLater).
 * Body: { amount: number (paise), receipt: string, currency?: string, notes?: object }
 * Returns: { orderId, amount, currency } for client checkout.
 */
export async function POST(req: NextRequest) {
  try {
    const client = getRazorpayClient()
    if (!client) {
      return NextResponse.json(
        { error: 'Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' },
        { status: 503 }
      )
    }
    const body = await req.json()
    const amount = Number(body?.amount)
    const receipt = typeof body?.receipt === 'string' ? body.receipt : undefined
    if (!receipt || !Number.isInteger(amount) || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid body: amount (paise, min 100) and receipt required.' },
        { status: 400 }
      )
    }
    const result = await createOrder({
      amount,
      currency: body.currency || 'INR',
      receipt,
      notes: body.notes ?? {},
    })
    if (!result) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 502 })
    }
    return NextResponse.json({
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (e) {
    console.error('[razorpay] create order error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
