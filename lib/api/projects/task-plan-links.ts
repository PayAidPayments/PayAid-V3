import { prisma } from '@/lib/db/prisma'

/** Validates phase/milestone belong to `projectId` and aligns phase with milestone when needed. */
export async function resolveTaskPlanLinks(
  projectId: string,
  phaseId: string | null | undefined,
  milestoneId: string | null | undefined
): Promise<
  { ok: true; phaseId: string | null; milestoneId: string | null } | { ok: false; status: number; error: string }
> {
  let resolvedPhase = phaseId ?? null
  const resolvedMilestone = milestoneId ?? null

  if (resolvedPhase) {
    const ph = await prisma.projectPhase.findFirst({
      where: { id: resolvedPhase, projectId },
    })
    if (!ph) {
      return { ok: false, status: 400, error: 'Phase not found on this project' }
    }
  }

  if (resolvedMilestone) {
    const ms = await prisma.projectMilestone.findFirst({
      where: { id: resolvedMilestone, projectId },
    })
    if (!ms) {
      return { ok: false, status: 400, error: 'Milestone not found on this project' }
    }
    if (ms.phaseId != null) {
      if (resolvedPhase == null) {
        resolvedPhase = ms.phaseId
      } else if (resolvedPhase !== ms.phaseId) {
        return {
          ok: false,
          status: 400,
          error: 'Selected phase does not match the milestone phase',
        }
      }
    }
  }

  return { ok: true, phaseId: resolvedPhase, milestoneId: resolvedMilestone }
}
