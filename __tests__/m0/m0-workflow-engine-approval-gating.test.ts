import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { runWorkflow } from '@/lib/workflow/engine'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    workflow: {
      findFirst: jest.fn(),
    },
    workflowExecution: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/audit/log', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}))

describe('workflow engine approval gating', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('marks execution as pending approval when step requires approval', async () => {
    const db = require('@/lib/db/prisma')

    db.prisma.workflow.findFirst.mockResolvedValue({
      id: 'wf_1',
      tenantId: 'tn_1',
      isActive: true,
      name: 'Approval Workflow',
      steps: [
        {
          id: 'step_approval',
          type: 'create_task',
          order: 1,
          config: {
            title: 'Needs approval',
            requiresApproval: true,
          },
        },
      ],
    })
    db.prisma.workflowExecution.create.mockResolvedValue({ id: 'exec_1' })
    db.prisma.workflowExecution.update.mockResolvedValue({ id: 'exec_1' })

    const result = await runWorkflow('wf_1', {
      tenantId: 'tn_1',
      event: 'invoice.created',
      data: {},
    })

    expect(result.status).toBe('PENDING_APPROVAL')
    expect(result.executionId).toBe('exec_1')
    expect(db.prisma.workflowExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'exec_1' },
        data: expect.objectContaining({
          status: 'PENDING_APPROVAL',
          completedAt: null,
        }),
      })
    )
  })
})
