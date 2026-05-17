import type { Prisma } from '@prisma/client'

export const MILESTONE_APPROVAL_SCRIPT_BASE_TAG = 'milestone_approval_script'
export const MILESTONE_APPROVAL_RUNTIME_TAG_PREFIX = 'pa_milestone_approval_auto:'

export function milestoneApprovalRuntimeTag(milestoneId: string) {
  return `${MILESTONE_APPROVAL_RUNTIME_TAG_PREFIX}${milestoneId}`
}

/**
 * Ensures one operator checklist task exists for milestones that require billing approval.
 * Idempotent via task tags; safe to call repeatedly from create/update routes.
 */
export async function ensureMilestoneApprovalChecklistTask(
  tx: Prisma.TransactionClient,
  input: {
    projectId: string
    milestoneId: string
    milestoneName: string
    dueDate: Date
    billingTrigger: string | null
    approvalRequired: boolean
    assigneeUserId: string | null
  }
): Promise<{ created: boolean }> {
  if ((input.billingTrigger || '').toUpperCase() !== 'ON_APPROVE') return { created: false }
  if (!input.approvalRequired) return { created: false }

  const keyTag = milestoneApprovalRuntimeTag(input.milestoneId)
  const existing = await tx.projectTask.findFirst({
    where: {
      projectId: input.projectId,
      tags: { hasEvery: [MILESTONE_APPROVAL_SCRIPT_BASE_TAG, keyTag] },
    },
    select: { id: true },
  })
  if (existing) return { created: false }

  const taskDue = new Date(input.dueDate)
  taskDue.setDate(taskDue.getDate() + 7)

  await tx.projectTask.create({
    data: {
      projectId: input.projectId,
      name: `Approve billing: ${input.milestoneName}`,
      description: `Billing approval checklist for milestone "${input.milestoneName}" (billingTrigger=ON_APPROVE).`,
      status: 'TODO',
      priority: 'HIGH',
      dueDate: taskDue,
      tags: [MILESTONE_APPROVAL_SCRIPT_BASE_TAG, keyTag],
      ...(input.assigneeUserId ? { assignedToId: input.assigneeUserId } : {}),
    },
  })
  return { created: true }
}

