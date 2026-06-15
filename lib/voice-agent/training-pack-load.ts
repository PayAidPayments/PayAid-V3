import { prisma as defaultPrisma } from '@payaid/db'
import type { PrismaClient } from '@prisma/client'
import type { TrainingPackApprovedSnapshot } from './training-pack-types'

export async function loadApprovedTrainingSnapshot(
  voiceAgentId: string,
  tenantId: string,
  prismaClient: PrismaClient = defaultPrisma as PrismaClient,
): Promise<TrainingPackApprovedSnapshot | null> {
  if (!prismaClient?.voiceAgentTrainingPack?.findFirst) return null
  const pack = await prismaClient.voiceAgentTrainingPack.findFirst({
    where: { voiceAgentId, tenantId },
    select: { approvedJson: true },
  })
  if (!pack?.approvedJson || typeof pack.approvedJson !== 'object') return null
  return pack.approvedJson as TrainingPackApprovedSnapshot
}

export async function trainingPackVersionForAgent(
  voiceAgentId: string,
  tenantId: string,
  prismaClient: PrismaClient = defaultPrisma as PrismaClient,
): Promise<number> {
  if (!prismaClient?.voiceAgentTrainingPack?.findFirst) return 0
  const pack = await prismaClient.voiceAgentTrainingPack.findFirst({
    where: { voiceAgentId, tenantId },
    select: { version: true },
  })
  return pack?.version ?? 0
}
