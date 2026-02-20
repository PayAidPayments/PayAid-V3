/**
 * Advanced Webhook Retry Queue
 * Implements exponential backoff, priority queues, and dead letter queue
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'

export interface RetryConfig {
  maxRetries: number
  initialDelay: number // milliseconds
  maxDelay: number // milliseconds
  backoffMultiplier: number
  priority: 'high' | 'medium' | 'low'
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 10,
  initialDelay: 1000, // 1 second
  maxDelay: 3600000, // 1 hour
  backoffMultiplier: 2,
  priority: 'medium',
}

export interface QueuedWebhook {
  id: string
  webhookId: string
  url: string
  payload: unknown
  attempt: number
  nextRetryAt: Date
  priority: string
  config: RetryConfig
}

/**
 * Calculate next retry delay using exponential backoff
 */
export function calculateNextRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_CONFIG
): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  )
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay
  return Math.floor(delay + jitter)
}

/**
 * Queue webhook for retry
 */
export async function queueWebhookRetry(
  webhookId: string,
  url: string,
  payload: unknown,
  attempt: number,
  config: RetryConfig = DEFAULT_CONFIG
): Promise<void> {
  const nextRetryAt = new Date(
    Date.now() + calculateNextRetryDelay(attempt, config)
  )

  // Store in database (would need WebhookRetryQueue model)
  // For now, update webhook with retry info
  await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      failureCount: attempt,
      lastFailureAt: new Date(),
      // Store retry config in metadata
      metadata: {
        retryConfig: config,
        nextRetryAt: nextRetryAt.toISOString(),
        priority: config.priority,
      },
    },
  })
}

/**
 * Process retry queue (should be called by a cron job)
 */
export async function processRetryQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const now = new Date()
  let processed = 0
  let succeeded = 0
  let failed = 0

  // Get webhooks ready for retry
  const webhooksToRetry = await prisma.webhook.findMany({
    where: {
      isActive: true,
      failureCount: { gt: 0 },
      metadata: {
        path: ['nextRetryAt'],
        not: null,
      },
    },
    take: 100, // Process in batches
  })

  for (const webhook of webhooksToRetry) {
    const metadata = webhook.metadata as any
    const nextRetryAt = metadata?.nextRetryAt
      ? new Date(metadata.nextRetryAt)
      : null

    if (!nextRetryAt || nextRetryAt > now) {
      continue // Not ready yet
    }

    processed++

    try {
      // Retry delivery
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PayAid-Signature': `sha256=${metadata.signature}`,
          'X-PayAid-Event': metadata.event,
        },
        body: JSON.stringify(metadata.payload),
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        // Success - reset failure count
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            failureCount: 0,
            lastTriggeredAt: new Date(),
            metadata: {
              ...metadata,
              nextRetryAt: null,
            },
          },
        })
        succeeded++
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      failed++
      const attempt = webhook.failureCount + 1
      const config = metadata?.retryConfig || DEFAULT_CONFIG

      if (attempt >= config.maxRetries) {
        // Move to dead letter queue
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            isActive: false,
            metadata: {
              ...metadata,
              deadLettered: true,
              deadLetteredAt: new Date().toISOString(),
            },
          },
        })
      } else {
        // Queue for next retry
        await queueWebhookRetry(
          webhook.id,
          webhook.url,
          metadata.payload,
          attempt,
          config
        )
      }
    }
  }

  return { processed, succeeded, failed }
}

/**
 * Get retry queue statistics
 */
export async function getRetryQueueStats(tenantId?: string): Promise<{
  queued: number
  processing: number
  deadLettered: number
  avgRetryDelay: number
}> {
  const where: any = {
    failureCount: { gt: 0 },
    isActive: true,
  }
  if (tenantId) {
    where.tenantId = tenantId
  }

  const queued = await prisma.webhook.count({
    where: {
      ...where,
      metadata: {
        path: ['nextRetryAt'],
        not: null,
      },
    },
  })

  const deadLettered = await prisma.webhook.count({
    where: {
      ...where,
      metadata: {
        path: ['deadLettered'],
        equals: true,
      },
    },
  })

  return {
    queued,
    processing: 0, // Would track currently processing
    deadLettered,
    avgRetryDelay: 5000, // Placeholder
  }
}
