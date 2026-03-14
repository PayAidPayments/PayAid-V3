import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, type RazorpayWebhookPayload } from '@/lib/payments/razorpay'

/**
 * POST /api/payments/razorpay/webhook – Razorpay webhook (payment.captured, payment.failed, etc.).
 * Configure this URL in Razorpay Dashboard → Webhooks.
 * Requires RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  let payload: RazorpayWebhookPayload
  try {
    payload = JSON.parse(raw) as RazorpayWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const event = payload?.event
  // Idempotent: queue to Bull or update invoice/order in DB here.
  if (event === 'payment.captured' || event === 'order.paid') {
    const payment = payload.payload?.payment?.entity
    const order = payload.payload?.order?.entity
    // TODO: update invoice/order status, trigger fulfillment
    if (payment?.order_id || order?.id) {
      // await updateOrderPayment(payment?.order_id ?? order?.id, 'captured')
    }
  }
  if (event === 'payment.failed') {
    // TODO: mark order as failed, notify
  }
  return NextResponse.json({ received: true })
}
