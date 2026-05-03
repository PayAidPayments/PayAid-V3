import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { decideWorkflowApproval, listPendingWorkflowApprovals } from '@/lib/workflow/approvals'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    workflowExecution: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/audit/log', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/workflow/engine', () => ({
  runWorkflow: jest.fn().mockResolvedValue({
    executionId: 'exec_rerun_1',
    status: 'COMPLETED',
  }),
}))

describe('workflow approval persistence and decisions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists pending workflow approvals for tenant', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.workflowExecution.findMany.mockResolvedValue([{ id: 'exec_1' }])

    const approvals = await listPendingWorkflowApprovals('tn_1')

    expect(approvals).toEqual([{ id: 'exec_1' }])
    expect(db.prisma.workflowExecution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tn_1',
          status: 'PENDING_APPROVAL',
        }),
      })
    )
  })

  it('rejects pending execution and records cancellation', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.workflowExecution.findFirst.mockResolvedValue({
      id: 'exec_2',
      workflowId: 'wf_1',
      status: 'PENDING_APPROVAL',
      workflow: { id: 'wf_1', name: 'Approval Flow' },
    })
    db.prisma.workflowExecution.update.mockResolvedValue({ id: 'exec_2' })

    const result = await decideWorkflowApproval({
      tenantId: 'tn_1',
      executionId: 'exec_2',
      decision: 'REJECT',
      userId: 'usr_1',
      note: 'Policy violation',
    })

    expect(result).toEqual({ status: 'REJECTED', rerunExecutionId: null })
    expect(db.prisma.workflowExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'exec_2' },
        data: expect.objectContaining({
          status: 'CANCELLED',
        }),
      })
    )
  })
})
