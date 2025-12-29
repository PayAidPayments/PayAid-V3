/**
 * Loyalty Program Utilities
 * Handles loyalty points earning and redemption logic
 */

import { prisma } from '@/lib/db/prisma'

export interface EarnPointsParams {
  tenantId: string
  programId: string
  customerId: string
  transactionId: string
  amount: number // Transaction amount in rupees
  description?: string
}

/**
 * Earn loyalty points from a retail transaction
 */
export async function earnLoyaltyPoints(params: EarnPointsParams) {
  const { tenantId, programId, customerId, transactionId, amount, description } = params

  // Get loyalty program
  const program = await prisma.loyaltyProgram.findUnique({
    where: { id: programId },
  })

  if (!program || !program.isActive) {
    return null // Program not found or inactive
  }

  // Calculate points earned
  const pointsEarned = amount * Number(program.pointsPerRupee)

  // Get or create loyalty points record
  let points = await prisma.loyaltyPoints.findUnique({
    where: {
      tenantId_programId_customerId: {
        tenantId,
        programId,
        customerId,
      },
    },
  })

  if (!points) {
    // Create new loyalty points record
    points = await prisma.loyaltyPoints.create({
      data: {
        tenantId,
        programId,
        customerId,
        currentPoints: pointsEarned,
        totalEarned: pointsEarned,
        totalRedeemed: 0,
        lastTransactionAt: new Date(),
        pointsExpiryAt: program.expiryDays
          ? new Date(Date.now() + program.expiryDays * 24 * 60 * 60 * 1000)
          : null,
      },
    })
  } else {
    // Update existing points
    const newBalance = Number(points.currentPoints) + pointsEarned
    const newTotalEarned = Number(points.totalEarned) + pointsEarned

    // Check and update tier if tiers are enabled
    let newTier = points.tier
    if (program.enableTiers && program.tiers) {
      const tiers = program.tiers as Array<{ name: string; minPoints: number }>
      // Find highest tier customer qualifies for
      const qualifyingTier = tiers
        .filter((t) => newBalance >= t.minPoints)
        .sort((a, b) => b.minPoints - a.minPoints)[0]
      
      if (qualifyingTier) {
        newTier = qualifyingTier.name
      }
    }

    points = await prisma.loyaltyPoints.update({
      where: { id: points.id },
      data: {
        currentPoints: newBalance,
        totalEarned: newTotalEarned,
        tier: newTier,
        lastTransactionAt: new Date(),
        pointsExpiryAt: program.expiryDays
          ? new Date(Date.now() + program.expiryDays * 24 * 60 * 60 * 1000)
          : null,
      },
    })
  }

  // Create earn transaction
  const transaction = await prisma.loyaltyTransaction.create({
    data: {
      tenantId,
      pointsId: points.id,
      programId,
      transactionId,
      type: 'EARNED',
      points: pointsEarned,
      balanceAfter: Number(points.currentPoints),
      description: description || `Earned from purchase #${transactionId}`,
    },
  })

  return { points, transaction }
}

/**
 * Get customer's loyalty points balance
 */
export async function getCustomerLoyaltyPoints(
  tenantId: string,
  customerId: string,
  programId?: string
) {
  const where: any = {
    tenantId,
    customerId,
  }

  if (programId) {
    where.programId = programId
  }

  return await prisma.loyaltyPoints.findMany({
    where,
    include: {
      program: true,
    },
  })
}

