import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'
import { addJob, mediumPriorityQueue } from '@/lib/queue/bull'
import { publishEvent } from '@/lib/redis/events'
import { multiLayerCache } from '@/lib/cache/multi-layer'

const OUTBOX_DISPATCH_ENTITY_TYPE = 'outbox_dispatch'
const OUTBOX_DLQ_ENTITY_TYPE = 'outbox_dlq'
const OUTBOX_REPLAY_ENTITY_TYPE = 'outbox_replay'

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

type OutboxDispatchJob = {
  outboxId: string
  tenantId: string
  eventType: string
  aggregateId: string
  traceId?: string | null
  data: Record<string, unknown>
}

declare global {
  // eslint-disable-next-line no-var
  var __payaidOutboxDispatcherInitialized: boolean | undefined
}

export function initializeOutboxDispatcher(): void {
  if (global.__payaidOutboxDispatcherInitialized) return
  global.__payaidOutboxDispatcherInitialized = true

  ;(mediumPriorityQueue as any).process('outbox.dispatch', async (job: any) => {
    const payload = job.data as OutboxDispatchJob
    const published = await publishEvent({
      event: payload.eventType,
      data: payload.data,
      module: 'outbox',
      tenantId: payload.tenantId,
      userId: 'system',
    })

    if (!published) {
      const attemptsMade = Number(job.attemptsMade || 0) + 1
      const maxAttempts = Number(job.opts?.attempts || 3)

      if (attemptsMade >= maxAttempts) {
        await prisma.auditLog.create({
          data: {
            tenantId: payload.tenantId,
            entityType: OUTBOX_DLQ_ENTITY_TYPE,
            entityId: payload.outboxId,
            changedBy: 'system',
            changeSummary: `Outbox dispatch moved to DLQ: ${payload.eventType}`,
            afterSnapshot: asInputJson({
              outboxId: payload.outboxId,
              eventType: payload.eventType,
              aggregateId: payload.aggregateId,
              traceId: payload.traceId ?? null,
              data: payload.data,
              attemptsMade,
              maxAttempts,
              status: 'dead_letter',
            }),
          },
        })
        await invalidateOutboxCaches(payload.tenantId)
      }

      throw new Error(`Failed to publish outbox event: ${payload.eventType}`)
    }

    await prisma.auditLog.create({
      data: {
        tenantId: payload.tenantId,
        entityType: OUTBOX_DISPATCH_ENTITY_TYPE,
        entityId: payload.outboxId,
        changedBy: 'system',
        changeSummary: `Outbox dispatched: ${payload.eventType}`,
        afterSnapshot: asInputJson({
          outboxId: payload.outboxId,
          eventType: payload.eventType,
          aggregateId: payload.aggregateId,
          traceId: payload.traceId ?? null,
          status: 'dispatched',
        }),
      },
    })
    await invalidateOutboxCaches(payload.tenantId)
  })
}

export async function getOutboxOperationalMetrics(tenantId: string) {
  const [queuedCount, dispatchedCount, dlqCount] = await Promise.all([
    prisma.auditLog.count({
      where: { tenantId, entityType: 'outbox_event' },
    }),
    prisma.auditLog.count({
      where: { tenantId, entityType: OUTBOX_DISPATCH_ENTITY_TYPE },
    }),
    prisma.auditLog.count({
      where: { tenantId, entityType: OUTBOX_DLQ_ENTITY_TYPE },
    }),
  ])

  let queueCounts: Record<string, number> = {}
  try {
    const maybeQueue = mediumPriorityQueue as any
    if (typeof maybeQueue.getJobCounts === 'function') {
      queueCounts = await maybeQueue.getJobCounts()
    }
  } catch {
    queueCounts = {}
  }

  return {
    queuedCount,
    dispatchedCount,
    dlqCount,
    queueCounts,
  }
}

export async function getOutboxHealthStatus(tenantId: string) {
  const [lastDispatch, lastDlq] = await Promise.all([
    prisma.auditLog.findFirst({
      where: {
        tenantId,
        entityType: OUTBOX_DISPATCH_ENTITY_TYPE,
      },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true, entityId: true },
    }),
    prisma.auditLog.findFirst({
      where: {
        tenantId,
        entityType: OUTBOX_DLQ_ENTITY_TYPE,
      },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true, entityId: true },
    }),
  ])

  const maybeQueue = mediumPriorityQueue as any
  const queueInterfaceHealthy =
    typeof maybeQueue?.add === 'function' && typeof maybeQueue?.process === 'function'

  return {
    dispatcherInitialized: Boolean(global.__payaidOutboxDispatcherInitialized),
    queueInterfaceHealthy,
    lastDispatchAt: lastDispatch?.timestamp ?? null,
    lastDispatchOutboxId: lastDispatch?.entityId ?? null,
    lastDlqAt: lastDlq?.timestamp ?? null,
    lastDlqOutboxId: lastDlq?.entityId ?? null,
  }
}

export async function replayDeadLetterOutboxEvent(params: {
  tenantId: string
  outboxId: string
  triggeredBy: string
}) {
  const dlqRecord = await prisma.auditLog.findFirst({
    where: {
      tenantId: params.tenantId,
      entityType: OUTBOX_DLQ_ENTITY_TYPE,
      entityId: params.outboxId,
    },
    orderBy: { timestamp: 'desc' },
  })

  if (!dlqRecord) return null

  const snapshot = (dlqRecord.afterSnapshot || {}) as {
    eventType?: string
    aggregateId?: string
    traceId?: string | null
    data?: Record<string, unknown>
  }

  if (!snapshot.eventType || !snapshot.aggregateId || !snapshot.data) {
    throw new Error('DLQ record is missing required replay payload')
  }

  await addJob(
    mediumPriorityQueue,
    'outbox.dispatch',
    {
      outboxId: params.outboxId,
      tenantId: params.tenantId,
      eventType: snapshot.eventType,
      aggregateId: snapshot.aggregateId,
      traceId: snapshot.traceId ?? null,
      data: snapshot.data,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  )

  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      entityType: OUTBOX_REPLAY_ENTITY_TYPE,
      entityId: params.outboxId,
      changedBy: params.triggeredBy,
      changeSummary: `Outbox replay queued: ${snapshot.eventType}`,
      afterSnapshot: asInputJson({
        outboxId: params.outboxId,
        eventType: snapshot.eventType,
        aggregateId: snapshot.aggregateId,
        traceId: snapshot.traceId ?? null,
        status: 'replay_queued',
      }),
    },
  })
  await invalidateOutboxCaches(params.tenantId)

  return {
    outboxId: params.outboxId,
    eventType: snapshot.eventType,
    status: 'replay_queued' as const,
  }
}

export async function invalidateOutboxCaches(tenantId: string) {
  await Promise.all([
    multiLayerCache.delete(`outbox:metrics:${tenantId}`).catch(() => {}),
    multiLayerCache.delete(`outbox:health:${tenantId}`).catch(() => {}),
  ])
}
