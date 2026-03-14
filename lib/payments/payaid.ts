/**
 * PayAid Payments – primary PG (Admin API/Salt). Same pattern as Razorpay.
 * Use from /api/payments/payaid; webhook → Bull queue invoice update.
 */

import crypto from 'crypto'

/**
 * NOTE:
 * This file is the single compatibility surface for "PayAid" across the repo.
 * Several API routes expect a PayAidPayments client with methods like
 * getPaymentRequestUrl(), getPaymentStatus(), and createRefund().
 *
 * The actual PayAid network API details may vary by environment/vendor, so the
 * default implementation here is intentionally conservative and will throw if
 * required config is missing.
 */

export interface PayAidConfig {
  apiKey: string
  /** Sometimes referred to as "salt" / "secret key" in docs. */
  salt: string
  baseUrl?: string
  encryptionKey?: string
  decryptionKey?: string
}

const API_KEY = process.env.PAYAID_API_KEY
const SALT = process.env.PAYAID_SALT
const WEBHOOK_SECRET = process.env.PAYAID_WEBHOOK_SECRET ?? SALT

export function isPayAidConfigured(): boolean {
  return !!(API_KEY && SALT)
}

export interface CreateOrderParams {
  amount: number // paise (e.g. 50000 = ₹500)
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

/**
 * Create order via PayAid Admin API. Returns orderId for client checkout.
 * Replace with actual PayAid API call when endpoint is fixed.
 */
export async function createOrder(params: CreateOrderParams): Promise<{ orderId: string; amount: number; currency: string } | null> {
  if (!isPayAidConfigured()) return null
  const { amount, currency = 'INR', receipt } = params
  // TODO: POST to PayAid order API with API_KEY; return order_id, amount, currency
  // Stub: generate a local order id for integration testing
  const orderId = 'payaid_order_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex')
  return { orderId, amount, currency }
}

/**
 * Verify PayAid webhook signature (HMAC-SHA256 with SALT/WEBHOOK_SECRET).
 * Pass raw body and X-Payaid-Signature (or payload signature field).
 */
export function verifyWebhook(body: string, signature: string): boolean {
  const secret = WEBHOOK_SECRET || SALT
  if (!secret || !signature) return false
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))
}

export type PayaidWebhookEvent = 'payment.captured' | 'payment.failed' | 'order.paid' | 'refund.created'

export interface PayaidWebhookPayload {
  event: PayaidWebhookEvent
  payload?: {
    payment?: { id: string; order_id: string; status: string; amount: number }
    order?: { id: string; status: string; amount: number }
  }
}

export type PayAidMode = 'LIVE' | 'TEST'

export interface PayAidPaymentRequestInput {
  order_id: string
  amount: number // ₹ as decimal number (most routes pass rupees)
  currency: 'INR'
  description: string
  name: string
  email: string
  phone: string
  return_url: string
  return_url_failure?: string
  return_url_cancel?: string
  address_line_1?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  mode?: PayAidMode
  udf1?: string
  udf2?: string
  udf3?: string
  expiry_in_minutes?: number
}

export interface PayAidPaymentRequestResponse {
  url: string
  order_id: string
  uuid: string
  expiry_datetime: string
}

export interface PayAidPaymentStatusItem {
  amount: string
  response_code: number
  payment_datetime?: string
}
export interface PayAidPaymentStatusResponse {
  data?: PayAidPaymentStatusItem[]
}

export interface PayAidRefundResponse {
  refund_id: number
  refund_reference_no?: string
}

export class PayAidPayments {
  private config: PayAidConfig

  constructor(config: PayAidConfig) {
    this.config = {
      ...config,
      apiKey: (config.apiKey || '').trim(),
      salt: (config.salt || '').trim(),
    }
  }

  private ensureConfigured(): void {
    if (!this.config.apiKey || !this.config.salt) {
      throw new Error('PayAid is not configured. Set PAYAID_API_KEY and PAYAID_SALT (or provide config).')
    }
  }

  /**
   * Two-step integration entry point used throughout the app.
   * For now, this returns an application-generated URL that routes into our own
   * checkout handler. Swap to a real PayAid endpoint when finalized.
   */
  async getPaymentRequestUrl(input: PayAidPaymentRequestInput): Promise<PayAidPaymentRequestResponse> {
    this.ensureConfigured()
    const uuid = 'payaid_uuid_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex')
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || '').trim()
    const url = baseUrl
      ? `${baseUrl}/api/checkout?gateway=payaid&order_id=${encodeURIComponent(input.order_id)}&uuid=${encodeURIComponent(uuid)}`
      : `/api/checkout?gateway=payaid&order_id=${encodeURIComponent(input.order_id)}&uuid=${encodeURIComponent(uuid)}`

    const expiryMinutes = Math.max(1, Math.min(24 * 60, input.expiry_in_minutes ?? 60))
    const expiryDatetime = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()

    return {
      url,
      order_id: input.order_id,
      uuid,
      expiry_datetime: expiryDatetime,
    }
  }

  async getPaymentStatus(_input: { order_id: string }): Promise<PayAidPaymentStatusResponse> {
    this.ensureConfigured()
    // Placeholder until PayAid status endpoint is finalized.
    return { data: [] }
  }

  async createRefund(_input: { transaction_id: string; amount: number; description?: string }): Promise<PayAidRefundResponse> {
    this.ensureConfigured()
    // Placeholder until PayAid refund endpoint is finalized.
    return { refund_id: Math.floor(Math.random() * 1_000_000_000) }
  }
}

let singleton: PayAidPayments | null = null

export function createPayAidPayments(config?: Partial<PayAidConfig>): PayAidPayments {
  return new PayAidPayments({
    apiKey: config?.apiKey ?? process.env.PAYAID_API_KEY ?? '',
    salt: config?.salt ?? process.env.PAYAID_SALT ?? '',
    baseUrl: config?.baseUrl ?? process.env.PAYAID_PAYMENTS_BASE_URL,
    encryptionKey: config?.encryptionKey ?? process.env.PAYAID_ENCRYPTION_KEY,
    decryptionKey: config?.decryptionKey ?? process.env.PAYAID_DECRYPTION_KEY,
  })
}

export function getPayAidPayments(): PayAidPayments {
  if (!singleton) singleton = createPayAidPayments()
  return singleton
}
