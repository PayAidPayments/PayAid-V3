/**
 * Trigger workflows by event. Call from API routes after entity changes.
 * Runs asynchronously so it doesn't block the response.
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { runWorkflow } from './engine'
import { deliverWebhookEvent } from '@/lib/webhooks/delivery'

export interface TriggerOptions {
  tenantId: string
  event: string
  entity?: string
  entityId?: string
  data?: Record<string, unknown>
}

/**
 * Find all active workflows for this event and run them.
 * Intended to be called after creating/updating entities (e.g. contact created).
 * Does not await execution so the HTTP response is not delayed.
 */
export function triggerWorkflowsByEvent(options: TriggerOptions): void {
  const { tenantId, event, entity, entityId, data } = options
  prisma.workflow
    .findMany({
      where: {
        tenantId,
        isActive: true,
        triggerType: 'EVENT',
        triggerEvent: event,
      },
    })
    .then((workflows) => {
      return Promise.allSettled(
        workflows.map((w) =>
          runWorkflow(w.id, {
            tenantId,
            event,
            entity,
            entityId,
            data,
          })
        )
      )
    })
    .then((results) => {
      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length) {
        console.warn('[WORKFLOW] Some workflows failed:', failed)
      }
    })
    .catch((err) => {
      console.error('[WORKFLOW] triggerWorkflowsByEvent error:', err)
    })

  // Also deliver webhook events (async, don't block)
  deliverWebhookEvent(tenantId, event, {
    entity,
    entityId,
    ...data,
  }).catch((err) => {
    console.error('[WEBHOOK] deliverWebhookEvent error:', err)
  })
}
