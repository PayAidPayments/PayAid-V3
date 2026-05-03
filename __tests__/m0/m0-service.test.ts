import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import {
  createWorkflow,
  createWorkflowTestRun,
  hasSignalBeenIngested,
  listActionAudit,
  persistSignalAudit,
} from '@/lib/ai-native/m0-service'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    auditLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    workflow: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    workflowExecution: {
      create: jest.fn(),
    },
  },
}))

describe('M0 service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('checks signal idempotency by tenant and key', async () => {
    const { prisma } = require('@/lib/db/prisma')
    prisma.auditLog.findFirst.mockResolvedValue({
      id: 'log_1',
      timestamp: new Date('2026-04-06T10:20:00.000Z'),
    })

    const existing = await hasSignalBeenIngested('tn_123', 'evt_1')
    expect(existing?.id).toBe('log_1')
    expect(prisma.auditLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tn_123',
          entityType: 'signal',
          entityId: 'evt_1',
        }),
      })
    )
  })

  it('persists signal audit snapshot', async () => {
    const { prisma } = require('@/lib/db/prisma')
    prisma.auditLog.create.mockResolvedValue({ id: 'log_2' })

    const signal = {
      schema_version: '1.0',
      tenant_id: 'tn_123',
      event_id: 'evt_2',
      source: 'manual' as const,
      event_type: 'lead.intent_detected',
      entity_type: 'lead' as const,
      entity_id: 'lead_1',
      occurred_at: '2026-04-06T10:20:00.000Z',
      payload: {},
    }

    const row = await persistSignalAudit('tn_123', 'usr_1', 'evt_2', signal)
    expect(row.id).toBe('log_2')
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tn_123',
          changedBy: 'usr_1',
          entityType: 'signal',
          entityId: 'evt_2',
        }),
      })
    )
  })

  it('creates workflow and stores steps payload', async () => {
    const { prisma } = require('@/lib/db/prisma')
    prisma.workflow.create.mockResolvedValue({ id: 'wf_1', name: 'M0 workflow' })

    const workflow = await createWorkflow('tn_123', {
      schema_version: '1.0',
      name: 'M0 workflow',
      status: 'draft',
      trigger: { event_type: 'lead.intent_detected' },
      conditions: [{ field: 'intent_score', op: '>=', value: 70 }],
      actions: [{ type: 'task.create', params: { title: 'Call' } }],
      safety: { cooldown_minutes: 120, max_actions_per_day: 3 },
    })

    expect(workflow.id).toBe('wf_1')
    expect(prisma.workflow.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tn_123',
          triggerType: 'EVENT',
          triggerEvent: 'lead.intent_detected',
        }),
      })
    )
  })

  it('simulates signal -> workflow -> action execution path in test-run mode', async () => {
    const { prisma } = require('@/lib/db/prisma')
    prisma.workflow.findFirst.mockResolvedValue({
      id: 'wf_2',
      steps: { actions: [{ type: 'task.create' }, { type: 'sequence.enroll' }] },
    })
    prisma.workflowExecution.create.mockResolvedValue({
      id: 'exec_1',
      workflowId: 'wf_2',
      status: 'COMPLETED',
      result: { testRun: true, actionsPlanned: 2 },
      completedAt: new Date('2026-04-06T10:30:00.000Z'),
    })

    const execution = await createWorkflowTestRun('tn_123', 'wf_2', { reason: 'integration-test' })
    expect(execution?.result?.actionsPlanned).toBe(2)
    expect(prisma.workflowExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workflowId: 'wf_2',
          tenantId: 'tn_123',
          status: 'COMPLETED',
        }),
      })
    )
  })

  it('lists audit actions by entity scope', async () => {
    const { prisma } = require('@/lib/db/prisma')
    prisma.auditLog.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }])

    const actions = await listActionAudit({
      tenantId: 'tn_123',
      entityType: 'deal',
      entityId: 'deal_1',
      limit: 10,
    })

    expect(actions).toHaveLength(2)
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tn_123',
          entityType: 'deal',
          entityId: 'deal_1',
        }),
      })
    )
  })
})
