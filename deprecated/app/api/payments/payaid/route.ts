import { NextRequest, NextResponse } from 'next/server'
import { createOrder, isPayAidConfigured } from '@/lib/payments/payaid'

/**
 * POST /api/payments/payaid – Create PayAid order (primary PG).
 * Body: { amount: number (paise), receipt: string, currency?: string, notes?: object }
 * Returns: { orderId, amount, currency, gateway: 'payaid' } for client checkout.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isPayAidConfigured()) {
      return NextResponse.json(
        { error: 'PayAid not configured. Set PAYAID_API_KEY and PAYAID_SALT.' },
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
      gateway: 'payaid',
    })
  } catch (e) {
    console.error('[payaid] create order error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
