/**
 * Predictive Insights for Lead Scoring
 * Provides AI-powered predictions about lead behavior and recommendations
 */

import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { calculateEnhancedScore } from './enhanced-scorer'
import { collectHistoricalDealData } from './pipeline'
import type { Contact } from '@prisma/client'

export interface PredictiveInsight {
  type: 'likelihood' | 'timeline' | 'recommendation' | 'similar'
  title: string
  description: string
  confidence: number // 0-100
  value?: number
  action?: string
}

export interface LeadPrediction {
  likelihoodToClose: number // 0-100 percentage
  avgDaysToClose: number | null
  similarLeadsClosed: number
  recommendedAction: string
  confidence: number
  insights: PredictiveInsight[]
}

/**
 * Get predictive insights for a lead
 */
export async function getPredictiveInsights(
  contact: Contact,
  tenantId: string
): Promise<LeadPrediction> {
  // Get enhanced score
  const { score, components } = await calculateEnhancedScore(contact)

  // Get historical data for comparison
  const historicalData = await collectHistoricalDealData(tenantId, 200)

  // Calculate likelihood to close based on score and historical patterns
  const similarHistorical = historicalData.filter((d) => {
    const scoreDiff = Math.abs(
      (d.features.emailOpens + d.features.interactionCount) - 
      (components.engagement.emailOpens + components.engagement.interactionCount)
    )
    return scoreDiff < 5 // Similar engagement level
  })

  const wonSimilar = similarHistorical.filter((d) => d.won)
  const likelihoodToClose = similarHistorical.length > 0
    ? Math.round((wonSimilar.length / similarHistorical.length) * 100)
    : Math.min(100, Math.max(0, score)) // Use score as fallback

  // Calculate average days to close for similar leads
  const avgDaysToClose = wonSimilar.length > 0
    ? Math.round(
        wonSimilar.reduce((sum, d) => sum + d.daysToClose, 0) / wonSimilar.length
      )
    : null

  // Get similar leads count
  const similarLeadsClosed = wonSimilar.length

  // Generate recommendations
  const recommendedAction = getRecommendedAction(score, components, contact)

  // Calculate overall confidence
  const confidence = calculateConfidence(
    similarHistorical.length,
    historicalData.length,
    score
  )

  // Generate insights
  const insights: PredictiveInsight[] = [
    {
      type: 'likelihood',
      title: 'Likelihood to Close',
      description: `This lead has a ${likelihoodToClose}% likelihood to close based on similar historical leads.`,
      confidence,
      value: likelihoodToClose,
    },
    ...(avgDaysToClose
      ? [
          {
            type: 'timeline',
            title: 'Expected Timeline',
            description: `Similar leads closed in an average of ${avgDaysToClose} days.`,
            confidence: Math.min(confidence + 10, 100),
            value: avgDaysToClose,
          } as PredictiveInsight,
        ]
      : []),
    {
      type: 'similar',
      title: 'Similar Leads',
      description: `${similarLeadsClosed} similar leads have closed successfully.`,
      confidence: Math.min(confidence + 5, 100),
      value: similarLeadsClosed,
    },
    {
      type: 'recommendation',
      title: 'Recommended Action',
      description: recommendedAction,
      confidence: 75,
      action: recommendedAction,
    },
  ]

  return {
    likelihoodToClose,
    avgDaysToClose,
    similarLeadsClosed,
    recommendedAction,
    confidence,
    insights,
  }
}

/**
 * Get recommended next action based on score and components
 */
function getRecommendedAction(
  score: number,
  components: any,
  contact: Contact
): string {
  if (score >= 90) {
    return 'Schedule a demo immediately - this is a hot lead!'
  } else if (score >= 75) {
    return 'Send proposal and schedule follow-up call'
  } else if (score >= 60) {
    if (components.engagement.demoAttendance === 0) {
      return 'Schedule a product demo to increase engagement'
    }
    return 'Send case study and schedule discovery call'
  } else if (score >= 40) {
    return 'Send educational content and nurture sequence'
  } else {
    return 'Enroll in nurture sequence and wait for engagement signals'
  }
}

/**
 * Calculate prediction confidence
 */
function calculateConfidence(
  similarCount: number,
  totalHistorical: number,
  score: number
): number {
  // Base confidence on sample size
  let confidence = Math.min(100, (similarCount / 10) * 20) // Max 20 points for sample size

  // Add confidence based on total historical data
  if (totalHistorical > 50) confidence += 20
  if (totalHistorical > 100) confidence += 10

  // Add confidence based on score (higher scores are more predictable)
  if (score > 80) confidence += 20
  if (score > 60) confidence += 10

  return Math.min(100, Math.max(30, confidence))
}

/**
 * Get vertical-specific scoring recommendations
 */
export async function getVerticalScoringRecommendations(
  tenantId: string,
  vertical: 'fintech' | 'd2c' | 'agencies'
): Promise<{
  weights: Record<string, number>
  recommendations: string[]
}> {
  const recommendations: string[] = []
  const weights: Record<string, number> = {}

  switch (vertical) {
    case 'fintech':
      weights.compliance = 0.25
      weights.paymentVolume = 0.20
      weights.engagement = 0.25
      weights.demographic = 0.15
      weights.behavioral = 0.15
      recommendations.push('Weight compliance indicators higher for fintech leads')
      recommendations.push('Consider payment volume and transaction history')
      recommendations.push('Prioritize leads with regulatory compliance needs')
      break

    case 'd2c':
      weights.inventory = 0.25
      weights.monthlyRevenue = 0.20
      weights.engagement = 0.25
      weights.demographic = 0.15
      weights.behavioral = 0.15
      recommendations.push('Weight inventory management needs higher')
      recommendations.push('Consider monthly revenue and growth trajectory')
      recommendations.push('Prioritize leads with high SKU counts')
      break

    case 'agencies':
      weights.teamSize = 0.25
      weights.projectComplexity = 0.20
      weights.engagement = 0.25
      weights.demographic = 0.15
      weights.behavioral = 0.15
      recommendations.push('Weight team size and collaboration needs')
      recommendations.push('Consider project complexity and client count')
      recommendations.push('Prioritize leads managing multiple projects')
      break

    default:
      // Default weights
      weights.engagement = 0.30
      weights.demographic = 0.25
      weights.behavioral = 0.25
      weights.historical = 0.20
  }

  return { weights, recommendations }
}
