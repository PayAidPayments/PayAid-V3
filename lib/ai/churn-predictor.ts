import { prisma } from '@/lib/db/prisma'
import { Contact, Deal, Interaction, EmailMessage, EmailTracking } from '@prisma/client'

/**
 * Churn Risk Predictor
 * 
 * Calculates churn risk score (0-100%) based on:
 * - Usage patterns (logins, feature usage)
 * - Engagement metrics (email opens, clicks)
 * - Support ticket trends
 * - Payment behavior
 * - Deal activity
 */

export interface ChurnRiskInput {
  contactId: string
  tenantId: string
}

export interface ChurnRiskResult {
  riskScore: number // 0-100%
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: {
    usageDecline: number // -100 to 100 (negative = decline)
    engagementDrop: number // -100 to 100
    supportTickets: number // Count of recent tickets
    paymentDelays: number // Days of payment delay
    dealActivity: number // Days since last deal activity
  }
  reasons: string[] // Why this risk score
  recommendations: string[] // What to do about it
  predictedChurnDate?: Date // When churn might happen
}

/**
 * Calculate churn risk for a contact/customer
 */
export async function calculateChurnRisk(
  input: ChurnRiskInput
): Promise<ChurnRiskResult> {
  const contact = await prisma.contact.findUnique({
    where: { id: input.contactId, tenantId: input.tenantId },
    include: {
      deals: {
        where: { tenantId: input.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
  })

  if (!contact) {
    throw new Error('Contact not found')
  }

  // Calculate risk factors
  const factors = await calculateRiskFactors(contact, input.tenantId)

  // Calculate risk score
  const riskScore = calculateRiskScore(factors)

  // Determine risk level
  const riskLevel = determineRiskLevel(riskScore)

  // Generate reasons
  const reasons = generateReasons(factors, riskScore)

  // Generate recommendations
  const recommendations = generateRecommendations(factors, riskLevel)

  // Predict churn date (if high risk)
  const predictedChurnDate = riskScore >= 60
    ? predictChurnDate(factors)
    : undefined

  return {
    riskScore: parseFloat(riskScore.toFixed(1)),
    riskLevel,
    factors,
    reasons,
    recommendations,
    predictedChurnDate,
  }
}

/**
 * Calculate individual risk factors
 */
async function calculateRiskFactors(
  contact: Contact & {
    deals: Deal[]
    interactions: Interaction[]
  },
  tenantId: string
): Promise<ChurnRiskResult['factors']> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // 1. Usage Decline (compare last 30 days vs previous 30 days)
  const recentInteractions = contact.interactions.filter(
    (i) => i.createdAt >= thirtyDaysAgo
  )
  const previousInteractions = contact.interactions.filter(
    (i) => i.createdAt >= sixtyDaysAgo && i.createdAt < thirtyDaysAgo
  )

  const recentCount = recentInteractions.length
  const previousCount = previousInteractions.length
  const usageDecline =
    previousCount > 0
      ? ((recentCount - previousCount) / previousCount) * 100
      : recentCount === 0
      ? -100
      : 0

  // 2. Engagement Drop (email opens/clicks)
  const recentEmails = await prisma.emailMessage.findMany({
    where: {
      tenantId,
      contactId: contact.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      tracking: true,
    },
  })

  const previousEmails = await prisma.emailMessage.findMany({
    where: {
      tenantId,
      contactId: contact.id,
      createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
    include: {
      tracking: true,
    },
  })

  const recentOpenRate =
    recentEmails.length > 0
      ? (recentEmails.filter((e) => e.tracking?.openedAt).length / recentEmails.length) * 100
      : 0
  const previousOpenRate =
    previousEmails.length > 0
      ? (previousEmails.filter((e) => e.tracking?.openedAt).length / previousEmails.length) * 100
      : 0

  const engagementDrop = previousOpenRate > 0
    ? ((recentOpenRate - previousOpenRate) / previousOpenRate) * 100
    : recentOpenRate === 0
    ? -100
    : 0

  // 3. Support Tickets (count recent tickets)
  // Note: Assuming support tickets are tracked in interactions with type 'support'
  const supportTickets = contact.interactions.filter(
    (i) => i.type === 'support' && i.createdAt >= thirtyDaysAgo
  ).length

  // 4. Payment Delays (check invoice payment status)
  // Note: This would integrate with finance module
  // For now, we'll use a placeholder
  const paymentDelays = 0 // TODO: Integrate with finance module

  // 5. Deal Activity (days since last deal activity)
  const lastDeal = contact.deals[0]
  const lastDealActivity = lastDeal
    ? (now.getTime() - lastDeal.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    : 999

  return {
    usageDecline: parseFloat(usageDecline.toFixed(1)),
    engagementDrop: parseFloat(engagementDrop.toFixed(1)),
    supportTickets,
    paymentDelays,
    dealActivity: parseFloat(lastDealActivity.toFixed(1)),
  }
}

/**
 * Calculate overall risk score from factors
 */
function calculateRiskScore(factors: ChurnRiskResult['factors']): number {
  let score = 0

  // Usage decline contributes up to 30 points
  if (factors.usageDecline < -40) {
    score += 30
  } else if (factors.usageDecline < -20) {
    score += 20
  } else if (factors.usageDecline < 0) {
    score += 10
  }

  // Engagement drop contributes up to 25 points
  if (factors.engagementDrop < -40) {
    score += 25
  } else if (factors.engagementDrop < -20) {
    score += 15
  } else if (factors.engagementDrop < 0) {
    score += 8
  }

  // Support tickets contribute up to 20 points
  if (factors.supportTickets >= 5) {
    score += 20
  } else if (factors.supportTickets >= 3) {
    score += 12
  } else if (factors.supportTickets >= 1) {
    score += 5
  }

  // Payment delays contribute up to 15 points
  if (factors.paymentDelays > 30) {
    score += 15
  } else if (factors.paymentDelays > 15) {
    score += 10
  } else if (factors.paymentDelays > 7) {
    score += 5
  }

  // Deal activity contributes up to 10 points
  if (factors.dealActivity > 60) {
    score += 10
  } else if (factors.dealActivity > 30) {
    score += 5
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * Determine risk level from score
 */
function determineRiskLevel(riskScore: number): ChurnRiskResult['riskLevel'] {
  if (riskScore >= 80) return 'critical'
  if (riskScore >= 60) return 'high'
  if (riskScore >= 40) return 'medium'
  return 'low'
}

/**
 * Generate reasons for risk score
 */
function generateReasons(
  factors: ChurnRiskResult['factors'],
  riskScore: number
): string[] {
  const reasons: string[] = []

  if (factors.usageDecline < -40) {
    reasons.push(`Usage down ${Math.abs(factors.usageDecline).toFixed(0)}% in last 30 days`)
  }

  if (factors.engagementDrop < -40) {
    reasons.push(`Email engagement down ${Math.abs(factors.engagementDrop).toFixed(0)}%`)
  }

  if (factors.supportTickets >= 3) {
    reasons.push(`${factors.supportTickets} support tickets in last 30 days`)
  }

  if (factors.paymentDelays > 15) {
    reasons.push(`Payment delayed by ${factors.paymentDelays} days`)
  }

  if (factors.dealActivity > 60) {
    reasons.push(`No deal activity for ${Math.floor(factors.dealActivity)} days`)
  }

  if (reasons.length === 0) {
    reasons.push('Low engagement indicators detected')
  }

  return reasons
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  factors: ChurnRiskResult['factors'],
  riskLevel: ChurnRiskResult['riskLevel']
): string[] {
  const recommendations: string[] = []

  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Schedule immediate customer success call')
    recommendations.push('Offer discount or special retention package')
    recommendations.push('Request feedback on product experience')
  }

  if (factors.usageDecline < -20) {
    recommendations.push('Send re-engagement email with product tips')
    recommendations.push('Schedule onboarding refresh session')
  }

  if (factors.engagementDrop < -20) {
    recommendations.push('Personal outreach from account manager')
    recommendations.push('Share relevant case studies or success stories')
  }

  if (factors.supportTickets >= 3) {
    recommendations.push('Proactive support: Address outstanding issues')
    recommendations.push('Assign dedicated support resource')
  }

  if (factors.paymentDelays > 7) {
    recommendations.push('Payment reminder with flexible payment options')
    recommendations.push('Discuss payment plan if needed')
  }

  if (factors.dealActivity > 30) {
    recommendations.push('Re-engage with new product features or use cases')
    recommendations.push('Schedule quarterly business review')
  }

  if (recommendations.length === 0) {
    recommendations.push('Monitor closely and maintain regular check-ins')
  }

  return recommendations
}

/**
 * Predict churn date based on factors
 */
function predictChurnDate(factors: ChurnRiskResult['factors']): Date {
  const now = new Date()
  let daysUntilChurn = 90 // Default: 90 days

  // Adjust based on risk factors
  if (factors.usageDecline < -40) {
    daysUntilChurn = Math.min(daysUntilChurn, 30)
  }
  if (factors.engagementDrop < -40) {
    daysUntilChurn = Math.min(daysUntilChurn, 45)
  }
  if (factors.supportTickets >= 5) {
    daysUntilChurn = Math.min(daysUntilChurn, 20)
  }
  if (factors.paymentDelays > 30) {
    daysUntilChurn = Math.min(daysUntilChurn, 15)
  }

  const churnDate = new Date(now)
  churnDate.setDate(churnDate.getDate() + daysUntilChurn)

  return churnDate
}

/**
 * Batch calculate churn risk for multiple contacts
 */
export async function calculateBatchChurnRisk(
  contactIds: string[],
  tenantId: string
): Promise<Map<string, ChurnRiskResult>> {
  const results = new Map<string, ChurnRiskResult>()

  for (const contactId of contactIds) {
    try {
      const result = await calculateChurnRisk({ contactId, tenantId })
      results.set(contactId, result)
    } catch (error) {
      console.error(`Error calculating churn risk for contact ${contactId}:`, error)
    }
  }

  return results
}

/**
 * Get high-risk customers (churn risk >= 60%)
 */
export async function getHighRiskCustomers(
  tenantId: string,
  minRiskScore: number = 60
): Promise<Array<{ contactId: string; riskScore: number; riskLevel: string }>> {
  const contacts = await prisma.contact.findMany({
    where: {
      tenantId,
      stage: { notIn: ['lost', 'inactive'] },
    },
    select: { id: true },
  })

  const highRisk: Array<{ contactId: string; riskScore: number; riskLevel: string }> = []

  for (const contact of contacts) {
    try {
      const risk = await calculateChurnRisk({
        contactId: contact.id,
        tenantId,
      })

      if (risk.riskScore >= minRiskScore) {
        highRisk.push({
          contactId: contact.id,
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
        })
      }
    } catch (error) {
      console.error(`Error calculating risk for contact ${contact.id}:`, error)
    }
  }

  return highRisk.sort((a, b) => b.riskScore - a.riskScore)
}
