/**
 * Webhook Dispatcher
 * Sends webhook events to registered endpoints
 */

import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

export interface WebhookEvent {
  type: string
  data: any
  timestamp: string
  tenantId: string
}

/**
 * Dispatch webhook event to all active webhooks for tenant
 */
export async function dispatchWebhook(
  tenantId: string,
  eventType: string,
  data: any
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: {
      tenantId,
      isActive: true,
      events: {
        has: eventType,
      },
    },
  })

  const event: WebhookEvent = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
    tenantId,
  }

  // Dispatch to all matching webhooks
  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      try {
        const payload = JSON.stringify(event)
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(payload)
          .digest('hex')

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': eventType,
          },
          body: payload,
        })

        if (response.ok) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              lastTriggeredAt: new Date(),
              failureCount: 0,
            },
          })
        } else {
          throw new Error(`Webhook failed: ${response.status}`)
        }
      } catch (error) {
        // Increment failure count
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            failureCount: {
              increment: 1,
            },
          },
        })

        // Deactivate if too many failures
        if (webhook.failureCount >= 5) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: { isActive: false },
          })
        }

        console.error(`Webhook dispatch failed for ${webhook.url}:`, error)
      }
    })
  )
}

/**
 * Common webhook event types
 */
export const WEBHOOK_EVENTS = {
  // CRM Events
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
  DEAL_WON: 'deal.won',
  DEAL_LOST: 'deal.lost',
  
  // Invoice Events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  
  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_COMPLETED: 'order.completed',
  
  // Payment Events
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_FAILED: 'payment.failed',
  
  // Subscription Events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  
  // Work Order Events
  WORK_ORDER_CREATED: 'work_order.created',
  WORK_ORDER_COMPLETED: 'work_order.completed',
  
  // Contract Events
  CONTRACT_SIGNED: 'contract.signed',
  CONTRACT_EXPIRED: 'contract.expired',
} as const

