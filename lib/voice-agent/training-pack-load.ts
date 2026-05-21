import { prisma } from '@payaid/db'
import type { TrainingPackApprovedSnapshot } from './training-pack-types'

export async function loadApprovedTrainingSnapshot(
  voiceAgentId: string,
  tenantId: string,
): Promise<TrainingPackApprovedSnapshot | null> {
  const pack = await prisma.voiceAgentTrainingPack.findFirst({
    where: { voiceAgentId, tenantId },
    select: { approvedJson: true },
  })
  if (!pack?.approvedJson || typeof pack.approvedJson !== 'object') return null
  return pack.approvedJson as TrainingPackApprovedSnapshot
}

export async function trainingPackVersionForAgent(
  voiceAgentId: string,
  tenantId: string,
): Promise<number> {
  const pack = await prisma.voiceAgentTrainingPack.findFirst({
    where: { voiceAgentId, tenantId },
    select: { version: true },
  })
  return pack?.version ?? 0
}
