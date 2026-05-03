/**
 * Customer Insights Service
 * AI-powered customer analytics including health score, churn prediction, and LTV calculation
 */

import { prisma } from '@/lib/db/prisma'

export interface CustomerInsightData {
  healthScore: number
  healthScoreComponents: {
    engagement: number
    payment: number
    support: number
  }
  churnRisk: number
  churnRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  churnReasons: string[]
  churnPredictionDate?: Date
  lifetimeValue: number
  predictedLTV?: number
  averageOrderValue?: number
  purchaseFrequency?: number
  engagementScore: number
  lastActivityDate?: Date
  activityCount: number
  responseRate?: number
  paymentScore: number
  averageDaysToPay?: number
  onTimePaymentRate?: number
  totalPaid: number
  totalOutstanding: number
  supportScore: number
  ticketCount: number
  averageResolutionTime?: number
  satisfactionScore?: number
  recommendedActions: string[]
  nextBestAction?: string
}

/**
 * Calculate customer health score (0-100)
 */
export async function calculateHealthScore(
  contactId: string,
  tenantId: string
): Promise<number> {
  const [engagement, payment, support] = await Promise.all([
    calculateEngagementScore(contactId, tenantId),
    calculatePaymentScore(contactId, tenantId),
    calculateSupportScore(contactId, tenantId),
  ])

  // Weighted average: Engagement 40%, Payment 40%, Support 20%
  const healthScore = engagement * 0.4 + payment * 0.4 + support * 0.2

  return Math.round(healthScore * 100) / 100
}

/**
 * Calculate engagement score (0-100)
 */
async function calculateEngagementScore(
  contactId: string,
  tenantId: string
): Promise<number> {
  const [interactions, lastActivity, deals] = await Promise.all([
    prisma.interaction.count({
      where: { contactId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.interaction.findFirst({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.deal.count({
      where: { contactId, stage: { not: 'lost' } },
    }),
  ])

  let score = 0

  // Interaction frequency (max 40 points)
  if (interactions >= 10) score += 40
  else if (interactions >= 5) score += 30
  else if (interactions >= 2) score += 20
  else if (interactions >= 1) score += 10

  // Recency (max 30 points)
  if (lastActivity) {
    const daysSinceLastActivity = Math.floor(
      (Date.now() - lastActivity.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    )
    if (daysSinceLastActivity <= 7) score += 30
    else if (daysSinceLastActivity <= 30) score += 20
    else if (daysSinceLastActivity <= 90) score += 10
  }

  // Active deals (max 30 points)
  if (deals >= 3) score += 30
  else if (deals >= 2) score += 20
  else if (deals >= 1) score += 10

  return Math.min(score, 100) / 100 // Normalize to 0-1
}

/**
 * Calculate payment score (0-100)
 */
async function calculatePaymentScore(
  contactId: string,
  tenantId: string
): Promise<number> {
  const invoices = await prisma.invoice.findMany({
    where: { customerId: contactId, tenantId },
    select: {
      total: true,
      paidAt: true,
      dueDate: true,
      status: true,
      createdAt: true,
    },
  })

  if (invoices.length === 0) return 0.5 // Neutral score for no payment history

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid')
  const onTimePayments = paidInvoices.filter((inv) => {
    if (!inv.dueDate) return false
    const paidDate = inv.createdAt // Simplified - should use actual payment date
    return paidDate <= inv.dueDate
  })

  const onTimeRate = paidInvoices.length > 0
    ? onTimePayments.length / paidInvoices.length
    : 0

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.paidAt ? inv.total : 0), 0)
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const paymentRate = totalInvoiced > 0 ? totalPaid / totalInvoiced : 0

  // Weighted: On-time rate 60%, Payment rate 40%
  const score = onTimeRate * 0.6 + paymentRate * 0.4

  return Math.min(score, 1)
}

/**
 * Calculate support score (0-100)
 */
async function calculateSupportScore(
  contactId: string,
  tenantId: string
): Promise<number> {
  // Simplified - would integrate with support ticket system
  // For now, return neutral score
  return 0.7
}

/**
 * Predict churn risk (0-100)
 */
export async function predictChurnRisk(
  contactId: string,
  tenantId: string
): Promise<{
  risk: number
  level: 'low' | 'medium' | 'high' | 'critical'
  reasons: string[]
  predictionDate?: Date
}> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      invoices: {
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      interactions: {
        where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!contact) {
    return { risk: 0, level: 'low', reasons: [] }
  }

  let riskScore = 0
  const reasons: string[] = []

  // Check last activity
  const lastInteraction = contact.interactions[0]
  if (lastInteraction) {
    const daysSinceLastActivity = Math.floor(
      (Date.now() - lastInteraction.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    )
    if (daysSinceLastActivity > 90) {
      riskScore += 40
      reasons.push('No activity in last 90 days')
    } else if (daysSinceLastActivity > 60) {
      riskScore += 25
      reasons.push('Low activity in last 60 days')
    }
  } else {
    riskScore += 30
    reasons.push('No recent interactions')
  }

  // Check payment behavior
  const overdueInvoices = contact.invoices.filter(
    (inv) => inv.status === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'paid')
  )
  if (overdueInvoices.length > 0) {
    riskScore += 30
    reasons.push(`${overdueInvoices.length} overdue invoice(s)`)
  }

  // Check payment delays
  const paidInvoices = contact.invoices.filter((inv) => inv.status === 'paid')
  if (paidInvoices.length > 0) {
    const avgDelay = paidInvoices.reduce((sum, inv) => {
      if (!inv.dueDate) return sum
      const delay = Math.max(0, (inv.createdAt.getTime() - inv.dueDate.getTime()) / (24 * 60 * 60 * 1000))
      return sum + delay
    }, 0) / paidInvoices.length

    if (avgDelay > 30) {
      riskScore += 20
      reasons.push('Consistently late payments')
    }
  }

  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (riskScore >= 80) level = 'critical'
  else if (riskScore >= 60) level = 'high'
  else if (riskScore >= 40) level = 'medium'

  // Predict churn date (if high risk)
  let predictionDate: Date | undefined
  if (riskScore >= 60) {
    predictionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }

  return {
    risk: Math.min(riskScore, 100),
    level,
    reasons,
    predictionDate,
  }
}

/**
 * Calculate Lifetime Value (LTV)
 */
export async function calculateLTV(
  contactId: string,
  tenantId: string
): Promise<{
  lifetimeValue: number
  predictedLTV?: number
  averageOrderValue?: number
  purchaseFrequency?: number
}> {
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId: contactId,
      tenantId,
      status: { in: ['paid', 'sent'] },
    },
    select: {
      total: true,
      createdAt: true,
      status: true,
    },
  })

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid')
  const lifetimeValue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)

  if (paidInvoices.length === 0) {
    return { lifetimeValue: 0 }
  }

  // Calculate average order value
  const averageOrderValue = lifetimeValue / paidInvoices.length

  // Calculate purchase frequency (invoices per month)
  const firstInvoice = paidInvoices[paidInvoices.length - 1]
  const lastInvoice = paidInvoices[0]
  const monthsActive = Math.max(
    1,
    (lastInvoice.createdAt.getTime() - firstInvoice.createdAt.getTime()) /
      (30 * 24 * 60 * 60 * 1000)
  )
  const purchaseFrequency = paidInvoices.length / monthsActive

  // Predict future LTV (simplified: assume same frequency for next 12 months)
  const predictedLTV = lifetimeValue + averageOrderValue * purchaseFrequency * 12

  return {
    lifetimeValue,
    predictedLTV,
    averageOrderValue,
    purchaseFrequency,
  }
}

/**
 * Generate customer insights
 */
export async function generateCustomerInsights(
  contactId: string,
  tenantId: string
): Promise<CustomerInsightData> {
  const [healthScore, healthComponents, churnData, ltvData] = await Promise.all([
    calculateHealthScore(contactId, tenantId),
    Promise.all([
      calculateEngagementScore(contactId, tenantId),
      calculatePaymentScore(contactId, tenantId),
      calculateSupportScore(contactId, tenantId),
    ]),
    predictChurnRisk(contactId, tenantId),
    calculateLTV(contactId, tenantId),
  ])

  // Get activity data
  const interactions = await prisma.interaction.findMany({
    where: { contactId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const lastActivity = interactions[0]?.createdAt

  // Get payment data
  const invoices = await prisma.invoice.findMany({
    where: { customerId: contactId, tenantId },
  })

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid')
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.paidAt ? inv.total : 0), 0)
  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + inv.total, 0)

  // Generate recommendations
  const recommendedActions = generateRecommendations(
    healthScore,
    churnData,
    ltvData,
    healthComponents
  )

  return {
    healthScore: Math.round(healthScore * 100) / 100,
    healthScoreComponents: {
      engagement: Math.round(healthComponents[0] * 100) / 100,
      payment: Math.round(healthComponents[1] * 100) / 100,
      support: Math.round(healthComponents[2] * 100) / 100,
    },
    churnRisk: churnData.risk,
    churnRiskLevel: churnData.level,
    churnReasons: churnData.reasons,
    churnPredictionDate: churnData.predictionDate,
    lifetimeValue: ltvData.lifetimeValue || 0,
    predictedLTV: ltvData.predictedLTV,
    averageOrderValue: ltvData.averageOrderValue,
    purchaseFrequency: ltvData.purchaseFrequency,
    engagementScore: Math.round(healthComponents[0] * 100) / 100,
    lastActivityDate: lastActivity,
    activityCount: interactions.length,
    paymentScore: Math.round(healthComponents[1] * 100) / 100,
    totalPaid,
    totalOutstanding,
    supportScore: Math.round(healthComponents[2] * 100) / 100,
    ticketCount: 0, // Would integrate with support system
    recommendedActions,
    nextBestAction: recommendedActions[0],
  }
}

/**
 * Generate AI recommendations based on insights
 */
function generateRecommendations(
  healthScore: number,
  churnData: { risk: number; level: string; reasons: string[] },
  ltvData: { lifetimeValue: number; predictedLTV?: number },
  components: number[]
): string[] {
  const recommendations: string[] = []

  if (churnData.risk >= 60) {
    recommendations.push('Schedule immediate follow-up call')
    recommendations.push('Offer retention discount or incentive')
    recommendations.push('Review and resolve any outstanding issues')
  } else if (churnData.risk >= 40) {
    recommendations.push('Increase engagement frequency')
    recommendations.push('Send personalized content')
  }

  if (components[0] < 0.5) {
    recommendations.push('Improve customer engagement')
    recommendations.push('Send relevant content and updates')
  }

  if (components[1] < 0.5) {
    recommendations.push('Review payment terms')
    recommendations.push('Consider payment plan options')
  }

  if (ltvData.lifetimeValue > 0 && ltvData.predictedLTV && ltvData.predictedLTV > ltvData.lifetimeValue * 2) {
    recommendations.push('Upsell additional products/services')
    recommendations.push('Introduce loyalty program benefits')
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current engagement level')
    recommendations.push('Continue providing excellent service')
  }

  return recommendations.slice(0, 5) // Return top 5 recommendations
}

/**
 * Save or update customer insights
 */
export async function saveCustomerInsights(
  contactId: string,
  tenantId: string,
  insights: CustomerInsightData
): Promise<void> {
  await prisma.customerInsight.upsert({
    where: {
      contactId_tenantId: {
        contactId,
        tenantId,
      },
    },
    create: {
      contactId,
      tenantId,
      ...insights,
      lastCalculatedAt: new Date(),
    },
    update: {
      ...insights,
      lastCalculatedAt: new Date(),
      updatedAt: new Date(),
    },
  })
}
