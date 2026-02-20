/**
 * Razorpay Payment Gateway Integration
 */

import 'server-only'

export interface RazorpayConfig {
  apiKey: string
  apiSecret: string
  webhookSecret?: string
}

/**
 * Generate Razorpay payment link
 */
export async function generateRazorpayPaymentLink(
  config: RazorpayConfig,
  amount: number,
  currency: string,
  description: string,
  customer: {
    name: string
    email?: string
    contact?: string
  },
  notes?: Record<string, string>
): Promise<{ paymentLinkId: string; shortUrl: string }> {
  try {
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency,
        description,
        customer: {
          name: customer.name,
          email: customer.email,
          contact: customer.contact,
        },
        notify: {
          sms: true,
          email: true,
        },
        notes: notes || {},
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.description || 'Failed to create payment link')
    }

    const data = await response.json()
    return {
      paymentLinkId: data.id,
      shortUrl: data.short_url,
    }
  } catch (error) {
    throw new Error(
      `Razorpay payment link generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyRazorpayWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return expectedSignature === signature
}

/**
 * Process Razorpay payment webhook
 */
export function processRazorpayWebhook(
  payload: any,
  signature: string,
  secret: string
): {
  valid: boolean
  event: string
  paymentId?: string
  orderId?: string
  amount?: number
  status?: string
} {
  const isValid = verifyRazorpayWebhookSignature(
    JSON.stringify(payload),
    signature,
    secret
  )

  if (!isValid) {
    return { valid: false, event: 'invalid_signature' }
  }

  const event = payload.event
  const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity

  return {
    valid: true,
    event,
    paymentId: entity?.id,
    orderId: entity?.order_id,
    amount: entity?.amount ? entity.amount / 100 : undefined, // Convert from paise
    status: entity?.status,
  }
}
