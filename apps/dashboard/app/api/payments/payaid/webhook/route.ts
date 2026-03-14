import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook, type PayaidWebhookPayload } from '@/lib/payments/payaid'
import { mediumPriorityQueue } from '@/lib/queue/bull'

/**
 * POST /api/payments/payaid/webhook – PayAid webhook → Bull queue invoice update.
 * Configure this URL in PayAid Admin. Header: X-Payaid-Signature (or your signing header).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('x-payaid-signature') ?? req.headers.get('x-webhook-signature') ?? ''
  if (!verifyWebhook(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  let payload: PayaidWebhookPayload
  try {
    payload = JSON.parse(raw) as PayaidWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const event = payload?.event
  if (event === 'payment.captured' || event === 'order.paid' || event === 'payment.failed') {
    try {
      await mediumPriorityQueue.add('payment-webhook', {
        gateway: 'payaid',
        event,
        payload: payload.payload,
        raw: payload,
      })
    } catch (e) {
      console.error('[payaid/webhook] queue error:', e)
    }
  }
  return NextResponse.json({ received: true })
}
