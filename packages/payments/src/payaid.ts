/**
 * @payaid/payments – PayAid primary PG (Admin API/Salt). Same pattern as Razorpay.
 */

import crypto from 'crypto'

const API_KEY = process.env.PAYAID_API_KEY
const SALT = process.env.PAYAID_SALT
const WEBHOOK_SECRET = process.env.PAYAID_WEBHOOK_SECRET ?? SALT

export function isPayAidConfigured(): boolean {
  return !!(API_KEY && SALT)
}

export interface PayaidCreateOrderParams {
  amount: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export async function createOrder(params: PayaidCreateOrderParams): Promise<{ orderId: string; amount: number; currency: string } | null> {
  if (!isPayAidConfigured()) return null
  const { amount, currency = 'INR', receipt } = params
  const orderId = 'payaid_order_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex')
  return { orderId, amount, currency }
}

export function verifyWebhook(body: string, signature: string): boolean {
  const secret = WEBHOOK_SECRET || SALT
  if (!secret || !signature) return false
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))
}

export type PayaidWebhookEvent = 'payment.captured' | 'payment.failed' | 'order.paid' | 'refund.created'
export interface PayaidWebhookPayload {
  event: PayaidWebhookEvent
  payload?: { payment?: { id: string; order_id: string; status: string; amount: number }; order?: { id: string; status: string; amount: number } }
}
