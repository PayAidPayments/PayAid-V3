import type { Prisma } from '@prisma/client'

/** Minimal execution template after a CRM deal closes won (§10.3). */
const DEAL_WON_STARTER_TASKS = [
  {
    name: 'Kickoff & discovery',
    description: 'Align scope, stakeholders, and success criteria with the customer.',
    priority: 'HIGH' as const,
    status: 'TODO' as const,
  },
  {
    name: 'Delivery execution',
    description: 'Build, configure, and iterate toward acceptance.',
    priority: 'MEDIUM' as const,
    status: 'TODO' as const,
  },
  {
    name: 'UAT, sign-off & handover',
    description: 'Customer verification, documentation, and readiness for billing / closure.',
    priority: 'MEDIUM' as const,
    status: 'TODO' as const,
  },
]

/**
 * Only runs for **deal-linked** project creates (`dealId` set).
 *
 * `seedDealStarterTasks === false` → never seeds.
 * `seedDealStarterTasks === true` → seeds (explicit opt-in).
 * `undefined` → seeds when deal **`stage`** is **`won`** (case-insensitive).
 */
export function resolveSeedDealStarterTasks(input: {
  seedDealStarterTasks: boolean | undefined
  dealId: string | undefined
  dealStage: string | null | undefined
}): boolean {
  if (input.seedDealStarterTasks === false) return false
  if (!input.dealId) return false
  if (input.seedDealStarterTasks === true) return true
  const won = String(input.dealStage || '').toLowerCase() === 'won'
  return won
}

export async function seedDealStarterProjectTasks(
  tx: Prisma.TransactionClient,
  input: { projectId: string; assigneeUserId: string | null },
): Promise<number> {
  const assignee = input.assigneeUserId
  for (const t of DEAL_WON_STARTER_TASKS) {
    await tx.projectTask.create({
      data: {
        projectId: input.projectId,
        name: t.name,
        description: t.description,
        priority: t.priority,
        status: t.status,
        tags: ['deal_starter_seed'],
        ...(assignee ? { assignedToId: assignee } : {}),
      },
    })
  }
  return DEAL_WON_STARTER_TASKS.length
}
