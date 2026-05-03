import 'server-only'
import { prisma } from '@/lib/db/prisma'
import { logAudit } from '@/lib/audit/log'
import { runWorkflow, type TriggerContext } from './engine'

type WorkflowApprovalDecision = 'APPROVE' | 'REJECT'

export async function listPendingWorkflowApprovals(tenantId: string) {
  return prisma.workflowExecution.findMany({
    where: {
      tenantId,
      status: 'PENDING_APPROVAL',
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          triggerEvent: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })
}

export async function decideWorkflowApproval(params: {
  tenantId: string
  executionId: string
  decision: WorkflowApprovalDecision
  userId: string
  note?: string
  approvedStepIds?: string[]
}) {
  const { tenantId, executionId, decision, userId, note, approvedStepIds = [] } = params
  const execution = await prisma.workflowExecution.findFirst({
    where: { id: executionId, tenantId },
    include: {
      workflow: {
        select: { id: true, name: true },
      },
    },
  })

  if (!execution) {
    throw new Error('Workflow execution not found')
  }
  if (execution.status !== 'PENDING_APPROVAL') {
    throw new Error('Workflow execution is not pending approval')
  }

  if (decision === 'REJECT') {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
        error: note || 'Rejected by approver',
      },
    })

    await logAudit({
      module: 'system',
      action: 'workflow.approval.rejected',
      entityType: 'workflow',
      entityId: execution.workflowId,
      tenantId,
      userId,
      summary: `Workflow execution rejected (${execution.workflow.name})`,
      diff: { after: { executionId: execution.id, note: note ?? null } },
    })

    return { status: 'REJECTED' as const, rerunExecutionId: null }
  }

  const triggerData = (execution.triggerData as Record<string, unknown> | null) ?? {}
  const previousData = (triggerData.data as Record<string, unknown> | undefined) ?? {}
  const rerunContext: TriggerContext = {
    tenantId,
    event: String(triggerData.event ?? 'manual.approval'),
    entity: typeof triggerData.entity === 'string' ? triggerData.entity : undefined,
    entityId: typeof triggerData.entityId === 'string' ? triggerData.entityId : undefined,
    data: {
      ...previousData,
      workflowApproval: {
        approved: true,
        approvedStepIds,
        approvedBy: userId,
        note: note ?? null,
      },
      actorUserId: userId,
    },
  }

  const rerun = await runWorkflow(execution.workflowId, rerunContext)

  await prisma.workflowExecution.update({
    where: { id: execution.id },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
      error: `Approved and superseded by execution ${rerun.executionId}`,
    },
  })

  await logAudit({
    module: 'system',
    action: 'workflow.approval.approved',
    entityType: 'workflow',
    entityId: execution.workflowId,
    tenantId,
    userId,
    summary: `Workflow execution approved (${execution.workflow.name})`,
    diff: {
      after: {
        executionId: execution.id,
        rerunExecutionId: rerun.executionId,
        approvedStepIds,
      },
    },
  })

  return { status: 'APPROVED' as const, rerunExecutionId: rerun.executionId }
}
