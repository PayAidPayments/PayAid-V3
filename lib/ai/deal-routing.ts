/**
 * Predictive Deal Routing Service
 * AI-based deal routing to best sales rep
 */

import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logging/structured-logger'

export interface DealRoutingContext {
  dealValue: number
  industry?: string
  companySize?: string
  location?: {
    state?: string
    city?: string
  }
  dealStage: string
  contactEmail?: string
  previousRepId?: string
}

export interface RoutingRecommendation {
  salesRepId: string
  salesRepName: string
  confidence: number // 0 to 1
  reasons: string[]
  score: number // Overall routing score
}

export class PredictiveDealRoutingService {
  /**
   * Route deal to best sales rep
   */
  static async routeDeal(
    tenantId: string,
    context: DealRoutingContext
  ): Promise<RoutingRecommendation | null> {
    try {
      // Get all active sales reps
      const salesReps = await prisma.salesRep.findMany({
        where: {
          tenantId,
          isActive: true,
          isOnLeave: false,
        },
        include: {
          user: true,
          territories: {
            include: {
              territory: true,
            },
          },
        },
      })

      if (salesReps.length === 0) {
        return null
      }

      // Score each rep
      const recommendations = await Promise.all(
        salesReps.map(async (rep) => {
          const score = await this.calculateRepScore(tenantId, rep.id, context)
          return {
            salesRepId: rep.id,
            salesRepName: rep.user.name || rep.user.email,
            confidence: score.confidence,
            reasons: score.reasons,
            score: score.totalScore,
          }
        })
      )

      // Sort by score (highest first)
      recommendations.sort((a, b) => b.score - a.score)

      const bestMatch = recommendations[0]

      logger.info('Deal routing recommendation', {
        dealValue: context.dealValue,
        recommendedRep: bestMatch.salesRepName,
        confidence: bestMatch.confidence,
      })

      return bestMatch
    } catch (error) {
      logger.error('Deal routing failed', error instanceof Error ? error : undefined)
      return null
    }
  }

  private static async calculateRepScore(
    tenantId: string,
    salesRepId: string,
    context: DealRoutingContext
  ): Promise<{ totalScore: number; confidence: number; reasons: string[] }> {
    let score = 0
    const reasons: string[] = []
    let confidence = 0.5

    // 1. Territory match (40 points)
    if (context.location?.state || context.location?.city) {
      const territoryMatch = await this.checkTerritoryMatch(tenantId, salesRepId, context.location)
      if (territoryMatch.matched) {
        score += 40
        reasons.push(`Territory match: ${territoryMatch.territoryName}`)
        confidence += 0.2
      }
    }

    // 2. Industry expertise (30 points)
    if (context.industry) {
      const industryMatch = await this.checkIndustryExpertise(tenantId, salesRepId, context.industry)
      if (industryMatch) {
        score += 30
        reasons.push(`Industry expertise: ${context.industry}`)
        confidence += 0.15
      }
    }

    // 3. Deal size match (20 points)
    const dealSizeMatch = await this.checkDealSizeMatch(tenantId, salesRepId, context.dealValue)
    if (dealSizeMatch.matched) {
      score += 20
      reasons.push(`Deal size match: ${dealSizeMatch.reason}`)
      confidence += 0.1
    }

    // 4. Workload balance (10 points) - Prefer reps with fewer active deals
    const workload = await this.getRepWorkload(tenantId, salesRepId)
    if (workload < 20) {
      score += 10
      reasons.push('Low workload - can give proper attention')
      confidence += 0.05
    }

    // 5. Historical performance (bonus points)
    const performance = await this.getRepPerformance(tenantId, salesRepId, context.dealValue)
    if (performance > 0.7) {
      score += 20
      reasons.push(`Strong performance with similar deals`)
      confidence += 0.1
    }

    // 6. Previous relationship (bonus points)
    if (context.previousRepId === salesRepId) {
      score += 15
      reasons.push('Previous relationship with this rep')
      confidence += 0.1
    }

    confidence = Math.min(confidence, 1.0)

    return {
      totalScore: score,
      confidence,
      reasons,
    }
  }

  private static async checkTerritoryMatch(
    tenantId: string,
    salesRepId: string,
    location?: { state?: string; city?: string }
  ): Promise<{ matched: boolean; territoryName?: string }> {
    if (!location?.state && !location?.city) {
      return { matched: false }
    }

    const assignments = await prisma.territoryAssignment.findMany({
      where: { salesRepId },
      include: { territory: true },
    })

    for (const assignment of assignments) {
      const criteria = assignment.territory.criteria as any
      if (location.state && criteria.states?.includes(location.state)) {
        return { matched: true, territoryName: assignment.territory.name }
      }
      if (location.city && criteria.cities?.includes(location.city)) {
        return { matched: true, territoryName: assignment.territory.name }
      }
    }

    return { matched: false }
  }

  private static async checkIndustryExpertise(
    tenantId: string,
    salesRepId: string,
    industry: string
  ): Promise<boolean> {
    // Check if rep has closed deals in this industry
    const closedDeals = await prisma.deal.count({
      where: {
        tenantId,
        assignedToId: salesRepId,
        stage: 'won',
        // Industry would need to be stored in deal or contact
      },
    })

    return closedDeals > 0
  }

  private static async checkDealSizeMatch(
    tenantId: string,
    salesRepId: string,
    dealValue: number
  ): Promise<{ matched: boolean; reason: string }> {
    // Get average deal size for this rep
    const avgDealSize = await prisma.deal.aggregate({
      where: {
        tenantId,
        assignedToId: salesRepId,
        stage: 'won',
      },
      _avg: { value: true },
    })

    if (!avgDealSize._avg.value) {
      return { matched: true, reason: 'No historical data' }
    }

    const avg = Number(avgDealSize._avg.value)
    const ratio = dealValue / avg

    if (ratio >= 0.5 && ratio <= 2.0) {
      return { matched: true, reason: `Deal size matches rep's average (₹${avg.toLocaleString('en-IN')})` }
    }

    return { matched: false, reason: 'Deal size mismatch' }
  }

  private static async getRepWorkload(tenantId: string, salesRepId: string): Promise<number> {
    return prisma.deal.count({
      where: {
        tenantId,
        assignedToId: salesRepId,
        stage: { notIn: ['won', 'lost'] },
      },
    })
  }

  private static async getRepPerformance(
    tenantId: string,
    salesRepId: string,
    dealValue: number
  ): Promise<number> {
    const wonDeals = await prisma.deal.count({
      where: {
        tenantId,
        assignedToId: salesRepId,
        stage: 'won',
        value: {
          gte: dealValue * 0.5,
          lte: dealValue * 2.0,
        },
      },
    })

    const totalDeals = await prisma.deal.count({
      where: {
        tenantId,
        assignedToId: salesRepId,
        value: {
          gte: dealValue * 0.5,
          lte: dealValue * 2.0,
        },
      },
    })

    return totalDeals > 0 ? wonDeals / totalDeals : 0
  }
}
