import { prisma } from '@/lib/db/prisma'
import { Contact, Deal, Interaction } from '@prisma/client'

/**
 * Upsell Opportunity Detector
 * 
 * Identifies customers with upsell potential based on:
 * - Feature usage patterns (using 30% of features = upsell opportunity)
 * - Growth signals (increasing usage, expanding team)
 * - Payment history (consistent payments = good candidate)
 * - Engagement level (high engagement = receptive to upsell)
 */

export interface UpsellOpportunityInput {
  contactId: string
  tenantId: string
}

export interface UpsellOpportunityResult {
  opportunityScore: number // 0-100%
  opportunityLevel: 'low' | 'medium' | 'high' | 'very-high'
  signals: {
    featureUsage: number // % of features used
    usageGrowth: number // % growth in usage
    teamSize: number // Current team size
    paymentHistory: number // Payment consistency score (0-100)
    engagement: number // Engagement score (0-100)
  }
  recommendedFeatures: string[] // Features they should upgrade to
  estimatedUpsellValue: number // Estimated additional revenue
  estimatedRetentionBoost: number // % retention improvement if upsold
  recommendations: string[] // How to approach upsell
}

/**
 * Calculate upsell opportunity for a contact
 */
export async function calculateUpsellOpportunity(
  input: UpsellOpportunityInput
): Promise<UpsellOpportunityResult> {
  const contact = await prisma.contact.findUnique({
    where: { id: input.contactId, tenantId: input.tenantId },
    include: {
      deals: {
        where: { tenantId: input.tenantId },
        orderBy: { createdAt: 'desc' },
      },
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!contact) {
    throw new Error('Contact not found')
  }

  // Calculate signals
  const signals = await calculateUpsellSignals(contact, input.tenantId)

  // Calculate opportunity score
  const opportunityScore = calculateOpportunityScore(signals)

  // Determine opportunity level
  const opportunityLevel = determineOpportunityLevel(opportunityScore)

  // Recommend features
  const recommendedFeatures = recommendFeatures(signals, contact)

  // Estimate upsell value
  const estimatedUpsellValue = estimateUpsellValue(contact, signals)

  // Estimate retention boost
  const estimatedRetentionBoost = estimateRetentionBoost(signals)

  // Generate recommendations
  const recommendations = generateUpsellRecommendations(
    signals,
    opportunityLevel,
    recommendedFeatures
  )

  return {
    opportunityScore: parseFloat(opportunityScore.toFixed(1)),
    opportunityLevel,
    signals,
    recommendedFeatures,
    estimatedUpsellValue: parseFloat(estimatedUpsellValue.toFixed(0)),
    estimatedRetentionBoost: parseFloat(estimatedRetentionBoost.toFixed(1)),
    recommendations,
  }
}

/**
 * Calculate upsell signals
 */
async function calculateUpsellSignals(
  contact: Contact & {
    deals: Deal[]
    interactions: Interaction[]
  },
  tenantId: string
): Promise<UpsellOpportunityResult['signals']> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // 1. Feature Usage (assume we track feature usage in interactions)
  // For now, estimate based on interaction types
  const featureTypes = new Set(
    contact.interactions.map((i) => i.type).filter((t) => t)
  )
  const totalFeatures = 10 // Total available features (this would come from product config)
  const featureUsage = (featureTypes.size / totalFeatures) * 100

  // 2. Usage Growth (compare last 30 days vs previous 30 days)
  const recentInteractions = contact.interactions.filter(
    (i) => i.createdAt >= thirtyDaysAgo
  )
  const previousInteractions = contact.interactions.filter(
    (i) => i.createdAt >= sixtyDaysAgo && i.createdAt < thirtyDaysAgo
  )

  const recentCount = recentInteractions.length
  const previousCount = previousInteractions.length
  const usageGrowth =
    previousCount > 0
      ? ((recentCount - previousCount) / previousCount) * 100
      : recentCount > 0
      ? 100
      : 0

  // 3. Team Size (estimate from interactions mentioning team members)
  const teamMentions = contact.interactions.filter((i) =>
    i.notes?.toLowerCase().includes('team') || i.notes?.toLowerCase().includes('member')
  ).length
  const teamSize = Math.max(1, teamMentions + 1) // At least 1 (the contact)

  // 4. Payment History (placeholder - would integrate with finance module)
  // Assume consistent payments if they have active deals
  const paymentHistory = contact.deals.length > 0 ? 85 : 50

  // 5. Engagement (based on interaction frequency and recency)
  const daysSinceLastInteraction =
    contact.interactions[0]
      ? (now.getTime() - contact.interactions[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)
      : 999

  let engagement = 100
  if (daysSinceLastInteraction > 30) engagement = 30
  else if (daysSinceLastInteraction > 14) engagement = 50
  else if (daysSinceLastInteraction > 7) engagement = 70
  else if (daysSinceLastInteraction > 3) engagement = 85

  // Boost engagement if usage is growing
  if (usageGrowth > 20) {
    engagement = Math.min(100, engagement + 15)
  }

  return {
    featureUsage: parseFloat(featureUsage.toFixed(1)),
    usageGrowth: parseFloat(usageGrowth.toFixed(1)),
    teamSize,
    paymentHistory,
    engagement: parseFloat(engagement.toFixed(1)),
  }
}

/**
 * Calculate opportunity score
 */
function calculateOpportunityScore(
  signals: UpsellOpportunityResult['signals']
): number {
  let score = 0

  // Feature usage: Low usage = high opportunity (0-30% usage = 30 points)
  if (signals.featureUsage < 30) {
    score += 30
  } else if (signals.featureUsage < 50) {
    score += 20
  } else if (signals.featureUsage < 70) {
    score += 10
  }

  // Usage growth: Growing usage = opportunity (up to 25 points)
  if (signals.usageGrowth > 50) {
    score += 25
  } else if (signals.usageGrowth > 20) {
    score += 15
  } else if (signals.usageGrowth > 0) {
    score += 8
  }

  // Team size: Larger teams = more value (up to 15 points)
  if (signals.teamSize >= 10) {
    score += 15
  } else if (signals.teamSize >= 5) {
    score += 10
  } else if (signals.teamSize >= 3) {
    score += 5
  }

  // Payment history: Consistent payments = good candidate (up to 15 points)
  if (signals.paymentHistory >= 90) {
    score += 15
  } else if (signals.paymentHistory >= 75) {
    score += 10
  } else if (signals.paymentHistory >= 60) {
    score += 5
  }

  // Engagement: High engagement = receptive (up to 15 points)
  if (signals.engagement >= 80) {
    score += 15
  } else if (signals.engagement >= 60) {
    score += 10
  } else if (signals.engagement >= 40) {
    score += 5
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * Determine opportunity level
 */
function determineOpportunityLevel(
  opportunityScore: number
): UpsellOpportunityResult['opportunityLevel'] {
  if (opportunityScore >= 80) return 'very-high'
  if (opportunityScore >= 60) return 'high'
  if (opportunityScore >= 40) return 'medium'
  return 'low'
}

/**
 * Recommend features based on usage patterns
 */
function recommendFeatures(
  signals: UpsellOpportunityResult['signals'],
  contact: Contact
): string[] {
  const features: string[] = []

  // If using < 30% of features, recommend automation features
  if (signals.featureUsage < 30) {
    features.push('Workflow Automation')
    features.push('Advanced Reporting')
  }

  // If team size is growing, recommend collaboration features
  if (signals.teamSize >= 5) {
    features.push('Team Collaboration')
    features.push('Role-Based Permissions')
  }

  // If usage is growing, recommend advanced features
  if (signals.usageGrowth > 20) {
    features.push('Advanced Analytics')
    features.push('API Access')
  }

  // Always recommend if engagement is high
  if (signals.engagement >= 80) {
    features.push('Premium Support')
    features.push('Custom Integrations')
  }

  return [...new Set(features)] // Remove duplicates
}

/**
 * Estimate upsell value
 */
function estimateUpsellValue(
  contact: Contact,
  signals: UpsellOpportunityResult['signals']
): number {
  // Base upsell value on current deal value and opportunity signals
  const baseValue = 5000 // Base monthly upsell value

  // Scale based on team size
  const teamMultiplier = Math.min(3, signals.teamSize / 5)

  // Scale based on feature usage (lower usage = higher potential)
  const usageMultiplier = signals.featureUsage < 30 ? 2 : signals.featureUsage < 50 ? 1.5 : 1

  // Scale based on engagement
  const engagementMultiplier = signals.engagement / 100

  return baseValue * teamMultiplier * usageMultiplier * engagementMultiplier
}

/**
 * Estimate retention boost from upsell
 */
function estimateRetentionBoost(
  signals: UpsellOpportunityResult['signals']
): number {
  // Upselling typically improves retention by 15-30%
  let boost = 20 // Base boost

  // Higher engagement = better retention boost
  if (signals.engagement >= 80) {
    boost += 10
  }

  // Growing usage = better retention
  if (signals.usageGrowth > 20) {
    boost += 5
  }

  return Math.min(40, boost) // Cap at 40%
}

/**
 * Generate upsell recommendations
 */
function generateUpsellRecommendations(
  signals: UpsellOpportunityResult['signals'],
  opportunityLevel: UpsellOpportunityResult['opportunityLevel'],
  recommendedFeatures: string[]
): string[] {
  const recommendations: string[] = []

  if (opportunityLevel === 'very-high' || opportunityLevel === 'high') {
    recommendations.push('Schedule upsell call this week')
    recommendations.push('Prepare personalized demo of recommended features')
  }

  if (signals.featureUsage < 30) {
    recommendations.push(
      `Customer using only ${signals.featureUsage.toFixed(0)}% of features. Show value of additional features.`
    )
  }

  if (signals.usageGrowth > 20) {
    recommendations.push(
      `Usage growing ${signals.usageGrowth.toFixed(0)}%. Perfect time to introduce advanced features.`
    )
  }

  if (signals.teamSize >= 5) {
    recommendations.push(
      `Team size: ${signals.teamSize}. Recommend team collaboration features.`
    )
  }

  if (recommendedFeatures.length > 0) {
    recommendations.push(
      `Recommended features: ${recommendedFeatures.join(', ')}`
    )
  }

  if (signals.engagement >= 80) {
    recommendations.push('High engagement. Customer is receptive to upsell conversation.')
  }

  return recommendations
}

/**
 * Get all upsell opportunities (opportunity score >= 50)
 */
export async function getUpsellOpportunities(
  tenantId: string,
  minOpportunityScore: number = 50
): Promise<
  Array<{
    contactId: string
    opportunityScore: number
    opportunityLevel: string
    estimatedUpsellValue: number
  }>
> {
  const contacts = await prisma.contact.findMany({
    where: {
      tenantId,
      stage: { notIn: ['lost', 'inactive'] },
    },
    select: { id: true },
  })

  const opportunities: Array<{
    contactId: string
    opportunityScore: number
    opportunityLevel: string
    estimatedUpsellValue: number
  }> = []

  for (const contact of contacts) {
    try {
      const opportunity = await calculateUpsellOpportunity({
        contactId: contact.id,
        tenantId,
      })

      if (opportunity.opportunityScore >= minOpportunityScore) {
        opportunities.push({
          contactId: contact.id,
          opportunityScore: opportunity.opportunityScore,
          opportunityLevel: opportunity.opportunityLevel,
          estimatedUpsellValue: opportunity.estimatedUpsellValue,
        })
      }
    } catch (error) {
      console.error(`Error calculating upsell for contact ${contact.id}:`, error)
    }
  }

  return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore)
}
