/**
 * Deal Rot Detection Service
 * Detects deals that are stuck in the same stage without activity
 * 
 * Rot Thresholds:
 * - Proposal stage: >14 days without activity = ROT
 * - Negotiation stage: >7 days without activity = ROT
 * - Demo stage: >10 days without activity = ROT
 * - Lead stage: >21 days without activity = ROT
 */

import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'

export interface DealRotConfig {
  stage: string
  maxDaysWithoutActivity: number
}

export interface RottingDeal {
  id: string
  name: string
  stage: string
  value: number
  daysStuck: number
  lastActivityAt: Date | null
  contactId: string | null
  contactName: string | null
  expectedCloseDate: Date | null
}

export interface DealRotResult {
  rottingDeals: RottingDeal[]
  totalCount: number
  byStage: Record<string, number>
  totalValue: number
}

// Default rot thresholds by stage
const DEFAULT_ROT_THRESHOLDS: DealRotConfig[] = [
  { stage: 'proposal', maxDaysWithoutActivity: 14 },
  { stage: 'negotiation', maxDaysWithoutActivity: 7 },
  { stage: 'demo', maxDaysWithoutActivity: 10 },
  { stage: 'qualified', maxDaysWithoutActivity: 10 },
  { stage: 'lead', maxDaysWithoutActivity: 21 },
]

/**
 * Get last activity date for a deal
 * Checks: interactions, email messages, tasks, deal updates
 */
async function getDealLastActivity(dealId: string, tenantId: string): Promise<Date | null> {
  const now = new Date()

  // Get most recent activity from various sources
  const [lastInteraction, lastEmail, lastTask, lastDealUpdate] = await Promise.all([
    // Last interaction with contact
    prismaRead.interaction.findFirst({
      where: {
        contact: {
          deals: {
            some: { id: dealId },
          },
          tenantId,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),

    // Last email with contact
    prismaRead.emailMessage.findFirst({
      where: {
        contact: {
          deals: {
            some: { id: dealId },
          },
        },
        account: {
          tenantId,
        },
      },
      orderBy: { receivedAt: 'desc' },
      select: { receivedAt: true },
    }),

    // Last task for deal/contact
    prismaRead.task.findFirst({
      where: {
        contact: {
          deals: {
            some: { id: dealId },
          },
          tenantId,
        },
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),

    // Deal's own updatedAt
    prismaRead.deal.findUnique({
      where: { id: dealId },
      select: { updatedAt: true },
    }),
  ])

  // Find the most recent activity
  const dates = [
    lastInteraction?.createdAt,
    lastEmail?.receivedAt,
    lastTask?.updatedAt,
    lastDealUpdate?.updatedAt,
  ].filter((d): d is Date => d !== null && d !== undefined)

  if (dates.length === 0) {
    return null
  }

  return new Date(Math.max(...dates.map((d) => d.getTime())))
}

/**
 * Calculate days since last activity
 */
function calculateDaysStuck(lastActivity: Date | null, dealCreatedAt: Date): number {
  if (!lastActivity) {
    // If no activity, use deal creation date
    const daysSinceCreation = Math.floor(
      (Date.now() - dealCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceCreation
  }

  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  )
  return daysSinceActivity
}

/**
 * Detect rotting deals for a tenant
 */
export async function detectRottingDeals(
  tenantId: string,
  customThresholds?: DealRotConfig[]
): Promise<DealRotResult> {
  const thresholds = customThresholds || DEFAULT_ROT_THRESHOLDS
  const thresholdMap = new Map(thresholds.map((t) => [t.stage, t.maxDaysWithoutActivity]))

  // Get all active deals (not won/lost)
  const deals = await prismaRead.deal.findMany({
    where: {
      tenantId,
      stage: {
        notIn: ['won', 'lost'],
      },
    },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const rottingDeals: RottingDeal[] = []
  const byStage: Record<string, number> = {}
  let totalValue = 0

  // Check each deal
  for (const deal of deals) {
    const threshold = thresholdMap.get(deal.stage) || 14 // Default 14 days
    const lastActivity = await getDealLastActivity(deal.id, tenantId)
    const daysStuck = calculateDaysStuck(lastActivity, deal.createdAt)

    if (daysStuck > threshold) {
      rottingDeals.push({
        id: deal.id,
        name: deal.name,
        stage: deal.stage,
        value: deal.value,
        daysStuck,
        lastActivityAt: lastActivity,
        contactId: deal.contactId,
        contactName: deal.contact?.name || null,
        expectedCloseDate: deal.expectedCloseDate,
      })

      // Count by stage
      byStage[deal.stage] = (byStage[deal.stage] || 0) + 1
      totalValue += deal.value
    }
  }

  // Sort by days stuck (most stuck first)
  rottingDeals.sort((a, b) => b.daysStuck - a.daysStuck)

  return {
    rottingDeals,
    totalCount: rottingDeals.length,
    byStage,
    totalValue,
  }
}

/**
 * Get rot statistics for a deal
 */
export async function getDealRotStatus(
  dealId: string,
  tenantId: string
): Promise<{
  isRotting: boolean
  daysStuck: number
  threshold: number
  lastActivity: Date | null
}> {
  const deal = await prismaRead.deal.findUnique({
    where: { id: dealId },
    select: {
      stage: true,
      createdAt: true,
      tenantId: true,
    },
  })

  if (!deal || deal.tenantId !== tenantId) {
    throw new Error('Deal not found')
  }

  const threshold = DEFAULT_ROT_THRESHOLDS.find((t) => t.stage === deal.stage)?.maxDaysWithoutActivity || 14
  const lastActivity = await getDealLastActivity(dealId, tenantId)
  const daysStuck = calculateDaysStuck(lastActivity, deal.createdAt)
  const isRotting = daysStuck > threshold

  return {
    isRotting,
    daysStuck,
    threshold,
    lastActivity,
  }
}

/**
 * Get suggested actions for a rotting deal
 */
export function getSuggestedActions(deal: RottingDeal): string[] {
  const actions: string[] = []

  if (deal.daysStuck > 21) {
    actions.push('Send urgent follow-up email')
    actions.push('Schedule a call with the contact')
    actions.push('Consider offering a discount or incentive')
    actions.push('Escalate to manager for review')
  } else if (deal.daysStuck > 14) {
    actions.push('Send follow-up email')
    actions.push('Schedule a call')
    actions.push('Ask for feedback on current status')
  } else {
    actions.push('Send gentle follow-up email')
    actions.push('Check if there are any blockers')
  }

  if (deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date()) {
    actions.push('Review expected close date - may need update')
  }

  return actions
}
