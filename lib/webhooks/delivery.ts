/**
 * Webhook Delivery System
 * Delivers webhook events to registered endpoints with retry logic
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { createHmac } from 'crypto'

export interface WebhookPayload {
  event: string
  timestamp: string
  tenantId: string
  data: Record<string, unknown>
}

/**
 * Deliver webhook event to all registered webhooks for the event
 */
export async function deliverWebhookEvent(
  tenantId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      tenantId,
      isActive: true,
      events: { has: event },
    },
  })

  if (webhooks.length === 0) return

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    tenantId,
    data,
  }

  // Deliver to all matching webhooks (async, don't block)
  Promise.allSettled(
    webhooks.map((webhook) => deliverToWebhook(webhook.id, webhook.url, webhook.secret, payload))
  ).then((results) => {
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      console.warn(`[WEBHOOK] ${failed.length} webhook deliveries failed for event ${event}`)
    }
  })
}

/**
 * Deliver payload to a specific webhook URL with signature
 */
async function deliverToWebhook(
  webhookId: string,
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<void> {
  const body = JSON.stringify(payload)
  const signature = createHmac('sha256', secret).update(body).digest('hex')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PayAid-Signature': `sha256=${signature}`,
        'X-PayAid-Event': payload.event,
        'X-PayAid-Timestamp': payload.timestamp,
      },
      body,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`)
    }

    // Update webhook stats
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: 0,
      },
    })
  } catch (error) {
    // Increment failure count
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    })
    if (webhook) {
      await prisma.webhook.update({
        where: { id: webhookId },
        data: {
          failureCount: webhook.failureCount + 1,
          // Deactivate after 10 failures
          isActive: webhook.failureCount + 1 < 10,
        },
      })
    }
    throw error
  }
}

/**
 * Verify webhook signature (for incoming webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex')
  const providedSignature = signature.replace('sha256=', '')
  return expectedSignature === providedSignature
}
