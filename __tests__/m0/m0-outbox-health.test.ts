import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { getOutboxHealthStatus } from '@/lib/outbox/dispatcher'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditLog: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('@/lib/queue/bull', () => ({
  mediumPriorityQueue: {
    add: jest.fn(),
    process: jest.fn(),
  },
  addJob: jest.fn(),
}))

describe('M0 outbox health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).__payaidOutboxDispatcherInitialized = true
  })

  it('returns health status with last dispatch and dlq', async () => {
    const prisma = require('@/lib/db/prisma')

    prisma.prisma.auditLog.findFirst
      .mockResolvedValueOnce({ timestamp: new Date('2026-04-06T10:00:00.000Z'), entityId: 'outbox_1' })
      .mockResolvedValueOnce({ timestamp: new Date('2026-04-06T11:00:00.000Z'), entityId: 'outbox_2' })

    const health = await getOutboxHealthStatus('tn_1')
    expect(health.dispatcherInitialized).toBe(true)
    expect(health.queueInterfaceHealthy).toBe(true)
    expect(health.lastDispatchOutboxId).toBe('outbox_1')
    expect(health.lastDlqOutboxId).toBe('outbox_2')
  })
})
