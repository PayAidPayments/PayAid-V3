import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { enqueueReliableOutboxEvent } from '@/lib/outbox/reliable-events'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/queue/bull', () => ({
  mediumPriorityQueue: {
    process: jest.fn(),
  },
  addJob: jest.fn(),
}))

describe('M0 outbox reliability baseline', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('queues outbox event with retry options', async () => {
    const prisma = require('@/lib/db/prisma')
    const queue = require('@/lib/queue/bull')

    prisma.prisma.auditLog.create.mockResolvedValue({ id: 'outbox_1' })
    queue.addJob.mockResolvedValue({ id: 'job_1' })

    const outbox = await enqueueReliableOutboxEvent({
      tenantId: 'tn_1',
      eventType: 'workflow.test_run.completed',
      aggregateId: 'exec_1',
      data: { workflowId: 'wf_1' },
    })

    expect(outbox.id).toBe('outbox_1')
    expect(queue.addJob).toHaveBeenCalledWith(
      expect.anything(),
      'outbox.dispatch',
      expect.objectContaining({
        outboxId: 'outbox_1',
        tenantId: 'tn_1',
      }),
      expect.objectContaining({
        attempts: 3,
      })
    )
  })

  it('writes dead-letter audit entry when queue add fails', async () => {
    const prisma = require('@/lib/db/prisma')
    const queue = require('@/lib/queue/bull')

    prisma.prisma.auditLog.create
      .mockResolvedValueOnce({ id: 'outbox_2' })
      .mockResolvedValueOnce({ id: 'dlq_1' })
    queue.addJob.mockRejectedValue(new Error('queue unavailable'))

    await expect(
      enqueueReliableOutboxEvent({
        tenantId: 'tn_1',
        eventType: 'workflow.test_run.completed',
        aggregateId: 'exec_2',
        data: { workflowId: 'wf_2' },
      })
    ).rejects.toThrow('queue unavailable')

    expect(prisma.prisma.auditLog.create).toHaveBeenCalledTimes(2)
  })
})
