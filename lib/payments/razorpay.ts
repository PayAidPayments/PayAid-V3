// @ts-nocheck
/**
 * Razorpay (UPI / PayLater / cards) – Phase 11 India SMB.
 * Orders, webhook verification. Use from /api/payments/razorpay.
 */

import Razorpay from 'razorpay'
import crypto from 'crypto'

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

export function getRazorpayClient(): Razorpay | null {
  if (!KEY_ID || !KEY_SECRET) return null
  return new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
}

export interface CreateOrderParams {
  amount: number // paise (e.g. 50000 = ₹500)
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export function createOrder(params: CreateOrderParams): Promise<{ orderId: string; amount: number; currency: string } | null> {
  const client = getRazorpayClient()
  if (!client) return Promise.resolve(null)
  const { amount, currency = 'INR', receipt, notes } = params
  return client.orders
    .create({
      amount,
      currency,
      receipt,
      notes: notes ?? {},
    })
    .then((order: { id: string; amount: number; currency: string }) => ({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }))
    .catch(() => null)
}

/** Verify webhook signature. Pass raw body and X-Razorpay-Signature header. */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || !signature) return false
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))
}

export type RazorpayWebhookEvent =
  | 'payment.captured'
  | 'payment.failed'
  | 'order.paid'
  | 'refund.created'
  | 'refund.processed'

export interface RazorpayWebhookPayload {
  event: RazorpayWebhookEvent
  payload?: {
    payment?: { entity: { id: string; order_id: string; status: string; amount: number } }
    order?: { entity: { id: string; status: string; amount: number } }
  }
}
