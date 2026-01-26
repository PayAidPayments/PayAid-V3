/**
 * Account Health Scoring Service
 * Calculates account health scores and risk factors
 */

import { prisma } from '@/lib/db/prisma'

export interface AccountHealthScore {
  score: number // 0-100
  riskLevel: 'green' | 'yellow' | 'red'
  factors: {
    engagement: number // 0-100
    revenue: number // 0-100
    support: number // 0-100
    contract: number // 0-100
  }
  recommendations: string[]
  lastUpdated: Date
}

export class AccountHealthService {
  /**
   * Calculate account health score
   */
  static async calculateHealthScore(
    tenantId: string,
    accountId: string
  ): Promise<AccountHealthScore> {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
      include: {
        contacts: {
          include: {
            interactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            deals: {
              where: { stage: 'won' },
            },
          },
        },
        contracts: {
          where: { status: 'ACTIVE' },
        },
      },
    })

    if (!account) {
      throw new Error('Account not found')
    }

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore(account.contacts)

    // Calculate revenue score (0-100)
    const revenueScore = this.calculateRevenueScore(account.contacts)

    // Calculate support score (0-100) - based on support tickets, response times
    const supportScore = 75 // TODO: Integrate with support system

    // Calculate contract score (0-100)
    const contractScore = this.calculateContractScore(account.contracts)

    // Weighted average
    const overallScore = Math.round(
      engagementScore * 0.3 +
      revenueScore * 0.3 +
      supportScore * 0.2 +
      contractScore * 0.2
    )

    const riskLevel = this.determineRiskLevel(overallScore)

    const recommendations = this.generateRecommendations(
      overallScore,
      engagementScore,
      revenueScore,
      supportScore,
      contractScore
    )

    // Update account health score
    await prisma.account.update({
      where: { id: accountId },
      data: {
        healthScore: overallScore,
        healthScoreUpdatedAt: new Date(),
      },
    })

    return {
      score: overallScore,
      riskLevel,
      factors: {
        engagement: engagementScore,
        revenue: revenueScore,
        support: supportScore,
        contract: contractScore,
      },
      recommendations,
      lastUpdated: new Date(),
    }
  }

  /**
   * Calculate engagement score
   */
  private static calculateEngagementScore(contacts: any[]): number {
    if (contacts.length === 0) return 0

    let totalScore = 0
    let contactCount = 0

    for (const contact of contacts) {
      const recentInteractions = contact.interactions.filter(
        (i: any) => new Date(i.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      )

      // Score based on interaction frequency
      let contactScore = 0
      if (recentInteractions.length >= 5) contactScore = 100
      else if (recentInteractions.length >= 3) contactScore = 75
      else if (recentInteractions.length >= 1) contactScore = 50
      else contactScore = 25

      totalScore += contactScore
      contactCount++
    }

    return contactCount > 0 ? Math.round(totalScore / contactCount) : 0
  }

  /**
   * Calculate revenue score
   */
  private static calculateRevenueScore(contacts: any[]): number {
    if (contacts.length === 0) return 0

    let totalRevenue = 0
    let dealCount = 0

    for (const contact of contacts) {
      for (const deal of contact.deals) {
        totalRevenue += deal.value
        dealCount++
      }
    }

    // Score based on revenue (normalized, assuming ₹10L = 100 score)
    const normalizedRevenue = Math.min((totalRevenue / 1000000) * 10, 100)
    return Math.round(normalizedRevenue)
  }

  /**
   * Calculate contract score
   */
  private static calculateContractScore(contracts: any[]): number {
    if (contracts.length === 0) return 50 // Neutral if no contracts

    const activeContracts = contracts.filter((c) => c.status === 'ACTIVE')
    if (activeContracts.length === 0) return 25

    // Check contract expiration
    const now = new Date()
    const expiringSoon = activeContracts.filter((c) => {
      if (!c.endDate) return false
      const daysUntilExpiry = Math.ceil(
        (new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0
    })

    if (expiringSoon.length > 0) return 50 // Yellow flag
    return 100 // All good
  }

  /**
   * Determine risk level
   */
  private static determineRiskLevel(score: number): 'green' | 'yellow' | 'red' {
    if (score >= 70) return 'green'
    if (score >= 40) return 'yellow'
    return 'red'
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(
    overall: number,
    engagement: number,
    revenue: number,
    support: number,
    contract: number
  ): string[] {
    const recommendations: string[] = []

    if (overall < 70) {
      if (engagement < 50) {
        recommendations.push('Schedule regular check-ins with key contacts')
        recommendations.push('Send quarterly business review invitations')
      }

      if (revenue < 50) {
        recommendations.push('Identify upsell opportunities')
        recommendations.push('Review pricing and contract terms')
      }

      if (support < 50) {
        recommendations.push('Address pending support tickets')
        recommendations.push('Improve response times')
      }

      if (contract < 50) {
        recommendations.push('Review contract renewal dates')
        recommendations.push('Initiate renewal discussions early')
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Account health is good. Continue regular engagement.')
    }

    return recommendations
  }

  /**
   * Get accounts by health score
   */
  static async getAccountsByHealth(
    tenantId: string,
    riskLevel?: 'green' | 'yellow' | 'red'
  ) {
    const accounts = await prisma.account.findMany({
      where: {
        tenantId,
        ...(riskLevel && {
          healthScore: riskLevel === 'green' ? { gte: 70 } : riskLevel === 'yellow' ? { gte: 40, lt: 70 } : { lt: 40 },
        }),
      },
      orderBy: { healthScore: 'asc' },
      include: {
        parentAccount: true,
        _count: {
          select: {
            contacts: true,
            contracts: true,
          },
        },
      },
    })

    return accounts
  }
}
