import { prisma } from '@/lib/db/prisma'
import { Deal, Interaction } from '@prisma/client'
import { calculateDealClosureProbability } from './deal-closure-probability'

export interface PipelineHealthMetrics {
  projectedCloseRate: number // % of deals expected to close this month
  lastMonthCloseRate: number // % of deals that closed last month
  stuckDeals: {
    count: number
    deals: Array<{ id: string; name: string; stage: string; daysStuck: number }>
  }
  readyToMove: {
    count: number
    deals: Array<{ id: string; name: string; currentStage: string; nextStage: string }>
  }
  recommendedActions: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

/**
 * Calculate pipeline health metrics
 */
export async function calculatePipelineHealth(
  tenantId: string
): Promise<PipelineHealthMetrics> {
  // Get all active deals
  const deals = await prisma.deal.findMany({
    where: {
      tenantId,
      status: { notIn: ['won', 'lost'] },
    },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  // Calculate projected close rate
  const projectedCloseRate = await calculateProjectedCloseRate(deals, tenantId)

  // Calculate last month close rate
  const lastMonthCloseRate = await calculateLastMonthCloseRate(tenantId)

  // Find stuck deals (no activity for >14 days)
  const stuckDeals = findStuckDeals(deals)

  // Find deals ready to move to next stage
  const readyToMove = findDealsReadyToMove(deals, tenantId)

  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(
    deals,
    stuckDeals,
    readyToMove
  )

  // Calculate risk level
  const riskLevel = calculateRiskLevel(projectedCloseRate, stuckDeals.count, deals.length)

  return {
    projectedCloseRate: parseFloat(projectedCloseRate.toFixed(1)),
    lastMonthCloseRate: parseFloat(lastMonthCloseRate.toFixed(1)),
    stuckDeals,
    readyToMove,
    recommendedActions,
    riskLevel,
  }
}

/**
 * Calculate projected close rate for this month
 */
async function calculateProjectedCloseRate(
  deals: Array<Deal & { interactions: Interaction[] }>,
  tenantId: string
): Promise<number> {
  if (deals.length === 0) return 0

  let totalProbability = 0
  let dealCount = 0

  // Calculate average probability for deals expected to close this month
  const thisMonth = new Date()
  thisMonth.setMonth(thisMonth.getMonth() + 1)
  thisMonth.setDate(0) // Last day of current month

  for (const deal of deals) {
    // Only consider deals with expected close date this month
    if (deal.expectedCloseDate && deal.expectedCloseDate <= thisMonth) {
      try {
        const probability = await calculateDealClosureProbability({
          dealId: deal.id,
          tenantId,
        })
        totalProbability += probability.probability
        dealCount++
      } catch (error) {
        console.error(`Error calculating probability for deal ${deal.id}:`, error)
      }
    }
  }

  return dealCount > 0 ? totalProbability / dealCount : 0
}

/**
 * Calculate last month's close rate
 */
async function calculateLastMonthCloseRate(tenantId: string): Promise<number> {
  const now = new Date()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const lastMonthDeals = await prisma.deal.findMany({
    where: {
      tenantId,
      status: { in: ['won', 'lost'] },
      actualCloseDate: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
  })

  const wonDeals = lastMonthDeals.filter((d) => d.status === 'won')
  return lastMonthDeals.length > 0
    ? (wonDeals.length / lastMonthDeals.length) * 100
    : 0
}

/**
 * Find stuck deals (no activity for >14 days)
 */
function findStuckDeals(
  deals: Array<Deal & { interactions: Interaction[] }>
): PipelineHealthMetrics['stuckDeals'] {
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const stuck: Array<{ id: string; name: string; stage: string; daysStuck: number }> = []

  for (const deal of deals) {
    const lastActivity = deal.interactions[0]?.createdAt || deal.createdAt
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceActivity > 14) {
      stuck.push({
        id: deal.id,
        name: deal.name,
        stage: deal.stage,
        daysStuck: Math.floor(daysSinceActivity),
      })
    }
  }

  return {
    count: stuck.length,
    deals: stuck.sort((a, b) => b.daysStuck - a.daysStuck).slice(0, 10), // Top 10
  }
}

/**
 * Find deals ready to move to next stage
 */
async function findDealsReadyToMove(
  deals: Array<Deal & { interactions: Interaction[] }>,
  tenantId: string
): Promise<PipelineHealthMetrics['readyToMove']> {
  const ready: Array<{ id: string; name: string; currentStage: string; nextStage: string }> = []

  // Stage progression map
  const stageProgression: Record<string, string> = {
    lead: 'contacted',
    contacted: 'demo',
    demo: 'proposal',
    proposal: 'negotiation',
    negotiation: 'closed-won',
  }

  for (const deal of deals) {
    const nextStage = stageProgression[deal.stage.toLowerCase()]
    if (!nextStage) continue

    // Check if deal has recent activity (ready to move)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const hasRecentActivity = deal.interactions.some((i) => i.createdAt >= sevenDaysAgo)

    if (hasRecentActivity) {
      try {
        const probability = await calculateDealClosureProbability({
          dealId: deal.id,
          tenantId,
        })

        // If probability is good for current stage, suggest moving
        if (probability.probability >= 50) {
          ready.push({
            id: deal.id,
            name: deal.name,
            currentStage: deal.stage,
            nextStage,
          })
        }
      } catch (error) {
        console.error(`Error checking deal ${deal.id}:`, error)
      }
    }
  }

  return {
    count: ready.length,
    deals: ready.slice(0, 10), // Top 10
  }
}

/**
 * Generate recommended actions
 */
function generateRecommendedActions(
  deals: Deal[],
  stuckDeals: PipelineHealthMetrics['stuckDeals'],
  readyToMove: PipelineHealthMetrics['readyToMove']
): string[] {
  const actions: string[] = []

  if (stuckDeals.count > 0) {
    actions.push(
      `${stuckDeals.count} deal${stuckDeals.count > 1 ? 's' : ''} stuck for >14 days. Schedule follow-up calls this week.`
    )
  }

  if (readyToMove.count > 0) {
    actions.push(
      `${readyToMove.count} deal${readyToMove.count > 1 ? 's' : ''} ready to move to next stage. Review and advance.`
    )
  }

  // Calculate deals closing this week
  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() + 7)
  const closingThisWeek = deals.filter(
    (d) => d.expectedCloseDate && d.expectedCloseDate <= thisWeek
  )
  if (closingThisWeek.length > 0) {
    actions.push(
      `${closingThisWeek.length} deal${closingThisWeek.length > 1 ? 's' : ''} expected to close this week. Focus on closing.`
    )
  }

  if (actions.length === 0) {
    actions.push('Pipeline looks healthy. Continue current activities.')
  }

  return actions
}

/**
 * Calculate risk level
 */
function calculateRiskLevel(
  projectedCloseRate: number,
  stuckDealsCount: number,
  totalDeals: number
): 'low' | 'medium' | 'high' {
  const stuckPercentage = totalDeals > 0 ? (stuckDealsCount / totalDeals) * 100 : 0

  if (projectedCloseRate < 30 || stuckPercentage > 30) {
    return 'high'
  }
  if (projectedCloseRate < 50 || stuckPercentage > 15) {
    return 'medium'
  }
  return 'low'
}
