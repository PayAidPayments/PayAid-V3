/**
 * AI Lead Scoring Service
 * Multi-factor lead scoring with conversion probability prediction
 */

import { prisma } from '@/lib/db/prisma'

export interface LeadScoreData {
  score: number // 0-100
  conversionProbability: number // 0-100
  factors: {
    engagement: number
    demographics: number
    behavior: number
    fit: number
  }
  recommendations: string[]
  nextBestAction?: string
}

/**
 * Calculate lead score based on multiple factors
 */
export async function calculateLeadScore(
  contactId: string,
  tenantId: string
): Promise<LeadScoreData> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      deals: {
        where: { tenantId },
      },
      invoices: {
        where: { tenantId },
        take: 10,
      },
    },
  })

  if (!contact) {
    return {
      score: 0,
      conversionProbability: 0,
      factors: { engagement: 0, demographics: 0, behavior: 0, fit: 0 },
      recommendations: [],
    }
  }

  // Factor 1: Engagement Score (0-100)
  const engagementScore = calculateEngagementScore(contact.interactions)

  // Factor 2: Demographics Score (0-100)
  const demographicsScore = calculateDemographicsScore(contact)

  // Factor 3: Behavior Score (0-100)
  const behaviorScore = calculateBehaviorScore(contact, contact.deals, contact.invoices)

  // Factor 4: Fit Score (0-100) - How well contact matches ideal customer profile
  const fitScore = calculateFitScore(contact)

  // Weighted overall score
  const overallScore =
    engagementScore * 0.3 +
    demographicsScore * 0.2 +
    behaviorScore * 0.3 +
    fitScore * 0.2

  // Conversion probability (based on historical data patterns)
  const conversionProbability = calculateConversionProbability(
    overallScore,
    contact.deals.length,
    contact.invoices.length
  )

  // Generate recommendations
  const recommendations = generateRecommendations(
    engagementScore,
    demographicsScore,
    behaviorScore,
    fitScore
  )

  return {
    score: Math.round(overallScore),
    conversionProbability: Math.round(conversionProbability),
    factors: {
      engagement: Math.round(engagementScore),
      demographics: Math.round(demographicsScore),
      behavior: Math.round(behaviorScore),
      fit: Math.round(fitScore),
    },
    recommendations,
    nextBestAction: recommendations[0],
  }
}

/**
 * Calculate engagement score based on interactions
 */
function calculateEngagementScore(interactions: any[]): number {
  if (interactions.length === 0) return 0

  let score = 0

  // Recency (max 40 points)
  const lastInteraction = interactions[0]
  if (lastInteraction) {
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - lastInteraction.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    )
    if (daysSinceLastInteraction <= 1) score += 40
    else if (daysSinceLastInteraction <= 7) score += 30
    else if (daysSinceLastInteraction <= 30) score += 20
    else if (daysSinceLastInteraction <= 90) score += 10
  }

  // Frequency (max 30 points)
  const recentInteractions = interactions.filter(
    (i) => Date.now() - i.createdAt.getTime() < 90 * 24 * 60 * 60 * 1000
  )
  if (recentInteractions.length >= 10) score += 30
  else if (recentInteractions.length >= 5) score += 20
  else if (recentInteractions.length >= 2) score += 10

  // Quality (max 30 points) - based on interaction types
  const qualityInteractions = interactions.filter(
    (i) => ['call', 'meeting', 'demo'].includes(i.type?.toLowerCase())
  )
  if (qualityInteractions.length >= 3) score += 30
  else if (qualityInteractions.length >= 2) score += 20
  else if (qualityInteractions.length >= 1) score += 10

  return Math.min(score, 100)
}

/**
 * Calculate demographics score
 */
function calculateDemographicsScore(contact: any): number {
  let score = 0

  // Company size (if available)
  if (contact.company) score += 20

  // Industry match (if available)
  if (contact.industry) score += 20

  // Location (if available)
  if (contact.city && contact.state) score += 15

  // Contact info completeness
  if (contact.email) score += 15
  if (contact.phone) score += 15
  if (contact.address) score += 15

  return Math.min(score, 100)
}

/**
 * Calculate behavior score
 */
function calculateBehaviorScore(contact: any, deals: any[], invoices: any[]): number {
  let score = 0

  // Deal activity
  const activeDeals = deals.filter((d) => d.stage !== 'lost' && d.stage !== 'won')
  if (activeDeals.length > 0) {
    score += 40
    const totalDealValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0)
    if (totalDealValue > 100000) score += 20
    else if (totalDealValue > 50000) score += 15
    else if (totalDealValue > 10000) score += 10
  }

  // Purchase history
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid')
  if (paidInvoices.length > 0) {
    score += 30
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
    if (totalPaid > 50000) score += 10
  }

  // Response rate (if tracked)
  if (contact.responseRate && contact.responseRate > 0.5) score += 10

  return Math.min(score, 100)
}

/**
 * Calculate fit score (ideal customer profile match)
 */
function calculateFitScore(contact: any): number {
  // Simplified - would use ML model in production
  let score = 50 // Base score

  // Positive indicators
  if (contact.company) score += 10
  if (contact.gstin) score += 10 // Business registration
  if (contact.tags && contact.tags.includes('qualified')) score += 15
  if (contact.likelyToBuy) score += 15

  // Negative indicators
  if (contact.churnRisk) score -= 20

  return Math.max(0, Math.min(score, 100))
}

/**
 * Calculate conversion probability
 */
function calculateConversionProbability(
  score: number,
  dealCount: number,
  invoiceCount: number
): number {
  // Base probability from score
  let probability = score * 0.7

  // Boost from existing deals
  if (dealCount > 0) probability += 15

  // Boost from purchase history
  if (invoiceCount > 0) probability += 15

  return Math.min(probability, 100)
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(
  engagement: number,
  demographics: number,
  behavior: number,
  fit: number
): string[] {
  const recommendations: string[] = []

  if (engagement < 50) {
    recommendations.push('Increase engagement frequency')
    recommendations.push('Send personalized content')
  }

  if (demographics < 50) {
    recommendations.push('Complete contact profile')
    recommendations.push('Gather more demographic data')
  }

  if (behavior < 50) {
    recommendations.push('Create a deal opportunity')
    recommendations.push('Schedule a demo or call')
  }

  if (fit < 50) {
    recommendations.push('Qualify lead against ICP')
    recommendations.push('Review lead source quality')
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current engagement level')
    recommendations.push('Move to next stage')
  }

  return recommendations.slice(0, 5)
}

/**
 * Update lead score for a contact
 */
export async function updateLeadScore(
  contactId: string,
  tenantId: string
): Promise<void> {
  const scoreData = await calculateLeadScore(contactId, tenantId)

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      leadScore: scoreData.score,
      scoreUpdatedAt: new Date(),
      scoreComponents: scoreData.factors,
    },
  })
}
