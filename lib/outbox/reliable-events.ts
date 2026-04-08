import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'
import { addJob, mediumPriorityQueue } from '@/lib/queue/bull'
import { initializeOutboxDispatcher, invalidateOutboxCaches } from '@/lib/outbox/dispatcher'

const OUTBOX_ENTITY_TYPE = 'outbox_event'
const DLQ_ENTITY_TYPE = 'outbox_dlq'

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

type OutboxPayload = {
  tenantId: string
  eventType: string
  aggregateId: string
  traceId?: string
  data: Record<string, unknown>
}

export async function enqueueReliableOutboxEvent(payload: OutboxPayload) {
  initializeOutboxDispatcher()

  const outbox = await prisma.auditLog.create({
    data: {
      tenantId: payload.tenantId,
      entityType: OUTBOX_ENTITY_TYPE,
      entityId: payload.aggregateId,
      changedBy: 'system',
      changeSummary: `Outbox queued: ${payload.eventType}`,
      afterSnapshot: asInputJson({
        eventType: payload.eventType,
        aggregateId: payload.aggregateId,
        traceId: payload.traceId ?? null,
        data: payload.data,
        status: 'queued',
      }),
    },
  })
  await invalidateOutboxCaches(payload.tenantId)

  try {
    await addJob(
      mediumPriorityQueue,
      'outbox.dispatch',
      {
        outboxId: outbox.id,
        tenantId: payload.tenantId,
        eventType: payload.eventType,
        aggregateId: payload.aggregateId,
        traceId: payload.traceId ?? null,
        data: payload.data,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    )
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        tenantId: payload.tenantId,
        entityType: DLQ_ENTITY_TYPE,
        entityId: outbox.id,
        changedBy: 'system',
        changeSummary: `Outbox moved to DLQ: ${payload.eventType}`,
        afterSnapshot: asInputJson({
          outboxId: outbox.id,
          eventType: payload.eventType,
          aggregateId: payload.aggregateId,
          traceId: payload.traceId ?? null,
          data: payload.data,
          error: error instanceof Error ? error.message : 'Unknown queue error',
          status: 'dead_letter',
        }),
      },
    })
    await invalidateOutboxCaches(payload.tenantId)
    throw error
  }

  return outbox
}
