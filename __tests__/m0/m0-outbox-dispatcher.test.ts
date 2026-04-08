import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import {
  getOutboxOperationalMetrics,
  initializeOutboxDispatcher,
  replayDeadLetterOutboxEvent,
} from '@/lib/outbox/dispatcher'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock('@/lib/redis/events', () => ({
  publishEvent: jest.fn(),
}))

jest.mock('@/lib/queue/bull', () => ({
  mediumPriorityQueue: {
    process: jest.fn(),
    getJobCounts: jest.fn(),
  },
  addJob: jest.fn(),
}))

describe('M0 outbox dispatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).__payaidOutboxDispatcherInitialized = undefined
  })

  it('initializes dispatcher only once', () => {
    const queue = require('@/lib/queue/bull')
    initializeOutboxDispatcher()
    initializeOutboxDispatcher()
    expect(queue.mediumPriorityQueue.process).toHaveBeenCalledTimes(1)
  })

  it('returns aggregated outbox metrics', async () => {
    const prisma = require('@/lib/db/prisma')
    const queue = require('@/lib/queue/bull')

    prisma.prisma.auditLog.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(1)
    queue.mediumPriorityQueue.getJobCounts.mockResolvedValue({
      waiting: 2,
      active: 1,
      failed: 1,
    })

    const metrics = await getOutboxOperationalMetrics('tn_1')
    expect(metrics.queuedCount).toBe(10)
    expect(metrics.dispatchedCount).toBe(8)
    expect(metrics.dlqCount).toBe(1)
    expect(metrics.queueCounts.waiting).toBe(2)
  })

  it('requeues DLQ outbox event for replay', async () => {
    const prisma = require('@/lib/db/prisma')
    const queue = require('@/lib/queue/bull')

    prisma.prisma.auditLog.findFirst = jest.fn().mockResolvedValue({
      id: 'dlq_1',
      afterSnapshot: {
        eventType: 'workflow.test_run.completed',
        aggregateId: 'exec_1',
        traceId: 'trace_1',
        data: { workflowId: 'wf_1' },
      },
    })
    prisma.prisma.auditLog.create.mockResolvedValue({ id: 'replay_audit_1' })
    queue.addJob.mockResolvedValue({ id: 'job_replay_1' })

    const replay = await replayDeadLetterOutboxEvent({
      tenantId: 'tn_1',
      outboxId: 'outbox_1',
      triggeredBy: 'usr_1',
    })

    expect(replay?.status).toBe('replay_queued')
    expect(queue.addJob).toHaveBeenCalled()
    expect(prisma.prisma.auditLog.create).toHaveBeenCalled()
  })
})
