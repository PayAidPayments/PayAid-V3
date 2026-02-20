import { prisma } from '@/lib/db/prisma'
import { Deal, Contact, Interaction, EmailMessage } from '@prisma/client'

/**
 * Deal Closure Probability Calculator
 * 
 * Calculates the probability of a deal closing based on:
 * - Stage-based base probability
 * - Weighted signals (CEO engagement, stakeholders, budget, etc.)
 * - Historical patterns
 * - Confidence score
 */

export interface DealClosureInput {
  dealId: string
  tenantId: string
}

export interface DealClosureResult {
  probability: number // 0-100%
  confidence: number // 0-100% (how sure are we?)
  baseProbability: number // Stage-based probability
  signalAdjustments: {
    ceoEngagement: number
    multipleStakeholders: number
    competitorMention: number
    budgetConfirmed: number
    recentActivity: number
    dealAge: number
    dealValue: number
  }
  recommendations: string[]
  riskFactors: string[]
}

/**
 * Stage-based base probabilities
 */
const STAGE_PROBABILITIES: Record<string, number> = {
  'lead': 5,
  'contacted': 15,
  'demo': 40,
  'proposal': 70,
  'negotiation': 85,
  'closed-won': 100,
  'closed-lost': 0,
}

/**
 * Calculate deal closure probability
 */
export async function calculateDealClosureProbability(
  input: DealClosureInput
): Promise<DealClosureResult> {
  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId, tenantId: input.tenantId },
    include: {
      // Deal doesn't have interactions relation directly, get through contact
      contact: {
        include: {
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
    },
  })

  if (!deal) {
    throw new Error('Deal not found')
  }

  // Base probability from stage
  const baseProbability = STAGE_PROBABILITIES[deal.stage.toLowerCase()] || 10

  // Calculate signal adjustments
  const signalAdjustments = await calculateSignalAdjustments(deal)

  // Calculate total probability
  let totalProbability = baseProbability
  totalProbability += signalAdjustments.ceoEngagement
  totalProbability += signalAdjustments.multipleStakeholders
  totalProbability += signalAdjustments.competitorMention
  totalProbability += signalAdjustments.budgetConfirmed
  totalProbability += signalAdjustments.recentActivity
  totalProbability += signalAdjustments.dealAge
  totalProbability += signalAdjustments.dealValue

  // Clamp between 0 and 100
  totalProbability = Math.max(0, Math.min(100, totalProbability))

  // Calculate confidence score
  const confidence = calculateConfidence(deal, signalAdjustments)

  // Generate recommendations
  const recommendations = generateRecommendations(deal, totalProbability, signalAdjustments)

  // Identify risk factors
  const riskFactors = identifyRiskFactors(deal, signalAdjustments)

  return {
    probability: parseFloat(totalProbability.toFixed(1)),
    confidence: parseFloat(confidence.toFixed(1)),
    baseProbability,
    signalAdjustments,
    recommendations,
    riskFactors,
  }
}

/**
 * Calculate weighted signal adjustments
 */
async function calculateSignalAdjustments(
  deal: Deal & {
    contact: (Contact & { interactions: Interaction[] }) | null
  }
): Promise<DealClosureResult['signalAdjustments']> {
  const adjustments = {
    ceoEngagement: 0,
    multipleStakeholders: 0,
    competitorMention: 0,
    budgetConfirmed: 0,
    recentActivity: 0,
    dealAge: 0,
    dealValue: 0,
  }

  // CEO Engagement (+20%)
  // Get interactions from contact, not deal directly
  const interactions = deal.contact?.interactions || []
  const hasCEOEngagement = interactions.some(
    (i) => i.type === 'meeting' && i.notes?.toLowerCase().includes('ceo')
  )
  if (hasCEOEngagement) {
    adjustments.ceoEngagement = 20
  }

  // Multiple Stakeholders (+15%)
  const stakeholderCount = new Set(
    interactions
      .filter((i) => i.notes?.includes('stakeholder') || i.notes?.includes('decision maker'))
      .map((i) => i.notes)
  ).size
  if (stakeholderCount >= 2) {
    adjustments.multipleStakeholders = 15
  }

  // Competitor Mention (-10%)
  const hasCompetitorMention = interactions.some(
    (i) => i.notes?.toLowerCase().includes('competitor') || i.notes?.toLowerCase().includes('alternative')
  )
  if (hasCompetitorMention) {
    adjustments.competitorMention = -10
  }

  // Budget Confirmed (+30%)
  const hasBudgetConfirmed = interactions.some(
    (i) => i.notes?.toLowerCase().includes('budget') && i.notes?.toLowerCase().includes('approved')
  )
  if (hasBudgetConfirmed) {
    adjustments.budgetConfirmed = 30
  }

  // Recent Activity (+5% per activity in last 7 days, max +15%)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentInteractions = interactions.filter((i) => i.createdAt >= sevenDaysAgo)
  adjustments.recentActivity = Math.min(15, recentInteractions.length * 5)

  // Deal Age (older deals get slight penalty if stuck)
  const dealAgeDays = (Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (dealAgeDays > 60 && recentInteractions.length === 0) {
    adjustments.dealAge = -10 // Stale deal penalty
  } else if (dealAgeDays < 30) {
    adjustments.dealAge = 5 // Fresh deal bonus
  }

  // Deal Value (larger deals get slight boost)
  if (deal.value > 1000000) {
    adjustments.dealValue = 5 // Large deal bonus
  } else if (deal.value < 50000) {
    adjustments.dealValue = -2 // Small deal slight penalty
  }

  return adjustments
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  deal: Deal & {
    contact: (Contact & { interactions: Interaction[] }) | null
  },
  adjustments: DealClosureResult['signalAdjustments']
): number {
  let confidence = 50 // Base confidence

  // More interactions = higher confidence
  // Get interactions from contact, not deal directly
  const interactionCount = deal.contact?.interactions?.length || 0
  confidence += Math.min(20, interactionCount * 2)

  // Recent activity = higher confidence
  if (adjustments.recentActivity > 0) {
    confidence += 10
  }

  // Budget confirmed = higher confidence
  if (adjustments.budgetConfirmed > 0) {
    confidence += 15
  }

  // CEO engagement = higher confidence
  if (adjustments.ceoEngagement > 0) {
    confidence += 10
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, confidence))
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  deal: Deal,
  probability: number,
  adjustments: DealClosureResult['signalAdjustments']
): string[] {
  const recommendations: string[] = []

  if (probability < 30) {
    recommendations.push('Low probability deal. Consider focusing on higher-probability opportunities.')
  }

  if (adjustments.competitorMention < 0) {
    recommendations.push('Competitor mentioned. Schedule a competitive differentiation call.')
  }

  if (adjustments.budgetConfirmed === 0) {
    recommendations.push('Budget not confirmed. Schedule a budget discussion meeting.')
  }

  if (adjustments.ceoEngagement === 0 && deal.value > 500000) {
    recommendations.push('Large deal without CEO engagement. Request executive sponsorship.')
  }

  if (adjustments.recentActivity === 0) {
    recommendations.push('No recent activity. Schedule a follow-up call this week.')
  }

  if (probability >= 70) {
    recommendations.push('High probability deal. Focus on closing this week.')
  }

  return recommendations
}

/**
 * Identify risk factors
 */
function identifyRiskFactors(
  deal: Deal,
  adjustments: DealClosureResult['signalAdjustments']
): string[] {
  const riskFactors: string[] = []

  if (adjustments.competitorMention < 0) {
    riskFactors.push('Competitor mentioned in discussions')
  }

  if (adjustments.dealAge < 0) {
    riskFactors.push('Deal has been inactive for extended period')
  }

  if (adjustments.recentActivity === 0) {
    riskFactors.push('No activity in the last 7 days')
  }

  if (adjustments.budgetConfirmed === 0 && deal.value > 200000) {
    riskFactors.push('Budget not confirmed for large deal')
  }

  return riskFactors
}

/**
 * Batch calculate probabilities for multiple deals
 */
export async function calculateBatchDealProbabilities(
  dealIds: string[],
  tenantId: string
): Promise<Map<string, DealClosureResult>> {
  const results = new Map<string, DealClosureResult>()

  for (const dealId of dealIds) {
    try {
      const result = await calculateDealClosureProbability({ dealId, tenantId })
      results.set(dealId, result)
    } catch (error) {
      console.error(`Error calculating probability for deal ${dealId}:`, error)
    }
  }

  return results
}
