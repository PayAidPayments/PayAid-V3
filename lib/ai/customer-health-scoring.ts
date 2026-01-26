import { prisma } from '@/lib/db/prisma'

export interface HealthScoreComponents {
  usage: {
    activeDays: number
    totalDays: number
    usagePercentage: number
    featuresUsed: number
    totalFeatures: number
  }
  support: {
    ticketCount: number
    recentTickets: number
    avgResolutionTime: number
    satisfactionScore: number
  }
  payment: {
    onTimePayments: number
    totalPayments: number
    latePayments: number
    daysOverdue: number
    paymentReliability: number
  }
  engagement: {
    emailOpenRate: number
    featureAdoption: number
    loginFrequency: number
    lastLoginDays: number
  }
  sentiment: {
    npsScore: number | null
    feedbackSentiment: 'positive' | 'neutral' | 'negative' | null
    recentFeedback: string[]
  }
}

export interface CustomerHealthScore {
  score: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskPercentage: number // 0-100%
  components: HealthScoreComponents
  factors: Array<{
    type: string
    impact: 'positive' | 'negative'
    message: string
    severity: 'low' | 'medium' | 'high'
  }>
  recommendations: string[]
  lastCalculated: Date
}

/**
 * Calculate customer health score
 */
export async function calculateCustomerHealthScore(
  contactId: string,
  tenantId: string
): Promise<CustomerHealthScore> {
  // Get all components
  const components = await getHealthScoreComponents(contactId, tenantId)

  let score = 100 // Start with perfect score
  const factors: Array<{
    type: string
    impact: 'positive' | 'negative'
    message: string
    severity: 'low' | 'medium' | 'high'
  }> = []
  const recommendations: string[] = []

  // Usage metrics (30% weight)
  const usageScore = calculateUsageScore(components.usage)
  score = score * 0.7 + usageScore * 0.3

  if (components.usage.usagePercentage < 30) {
    score -= 20
    factors.push({
      type: 'usage',
      impact: 'negative',
      message: `Low usage: Only ${components.usage.usagePercentage.toFixed(0)}% active days`,
      severity: 'high',
    })
    recommendations.push('Increase feature adoption through training and onboarding')
  } else if (components.usage.usagePercentage > 80) {
    factors.push({
      type: 'usage',
      impact: 'positive',
      message: `High usage: ${components.usage.usagePercentage.toFixed(0)}% active days`,
      severity: 'low',
    })
  }

  // Support tickets (20% weight)
  const supportScore = calculateSupportScore(components.support)
  score = score * 0.8 + supportScore * 0.2

  if (components.support.recentTickets > 3) {
    score -= 15
    factors.push({
      type: 'support',
      impact: 'negative',
      message: `${components.support.recentTickets} support tickets in last 30 days`,
      severity: 'high',
    })
    recommendations.push('Proactive outreach to address support issues')
  } else if (components.support.ticketCount === 0) {
    factors.push({
      type: 'support',
      impact: 'positive',
      message: 'No support tickets - customer is self-sufficient',
      severity: 'low',
    })
  }

  // Payment history (25% weight)
  const paymentScore = calculatePaymentScore(components.payment)
  score = score * 0.75 + paymentScore * 0.25

  if (components.payment.latePayments > 0) {
    score -= 25
    factors.push({
      type: 'payment',
      impact: 'negative',
      message: `${components.payment.latePayments} late payment(s), ${components.payment.daysOverdue} days overdue`,
      severity: 'high',
    })
    recommendations.push('Follow up on payment delays and offer payment plan if needed')
  } else if (components.payment.paymentReliability > 95) {
    factors.push({
      type: 'payment',
      impact: 'positive',
      message: 'Excellent payment history',
      severity: 'low',
    })
  }

  // Engagement (15% weight)
  const engagementScore = calculateEngagementScore(components.engagement)
  score = score * 0.85 + engagementScore * 0.15

  if (components.engagement.lastLoginDays > 30) {
    score -= 15
    factors.push({
      type: 'engagement',
      impact: 'negative',
      message: `No login for ${components.engagement.lastLoginDays} days`,
      severity: 'high',
    })
    recommendations.push('Re-engage customer with personalized outreach')
  } else if (components.engagement.emailOpenRate > 50) {
    factors.push({
      type: 'engagement',
      impact: 'positive',
      message: `High email engagement: ${components.engagement.emailOpenRate.toFixed(0)}% open rate`,
      severity: 'low',
    })
  }

  // Sentiment (10% weight)
  const sentimentScore = calculateSentimentScore(components.sentiment)
  score = score * 0.9 + sentimentScore * 0.1

  if (components.sentiment.feedbackSentiment === 'negative') {
    score -= 10
    factors.push({
      type: 'sentiment',
      impact: 'negative',
      message: 'Negative feedback detected',
      severity: 'medium',
    })
    recommendations.push('Address negative feedback immediately')
  } else if (components.sentiment.npsScore && components.sentiment.npsScore > 8) {
    factors.push({
      type: 'sentiment',
      impact: 'positive',
      message: `High NPS score: ${components.sentiment.npsScore}`,
      severity: 'low',
    })
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))

  // Calculate risk level
  const riskPercentage = 100 - score
  let riskLevel: 'low' | 'medium' | 'high' | 'critical'
  if (riskPercentage <= 30) {
    riskLevel = 'low'
  } else if (riskPercentage <= 50) {
    riskLevel = 'medium'
  } else if (riskPercentage <= 70) {
    riskLevel = 'high'
  } else {
    riskLevel = 'critical'
  }

  return {
    score: parseFloat(score.toFixed(1)),
    riskLevel,
    riskPercentage: parseFloat(riskPercentage.toFixed(1)),
    components,
    factors,
    recommendations,
    lastCalculated: new Date(),
  }
}

/**
 * Get health score components
 */
async function getHealthScoreComponents(
  contactId: string,
  tenantId: string
): Promise<HealthScoreComponents> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Get contact
  const contact = await prisma.contact.findUnique({
    where: { id: contactId, tenantId },
  })

  if (!contact) {
    throw new Error('Contact not found')
  }

  // Usage metrics
  const interactions = await prisma.interaction.findMany({
    where: {
      contactId,
      tenantId,
      createdAt: { gte: ninetyDaysAgo },
    },
    select: { createdAt: true },
  })

  const activeDays = new Set(
    interactions.map((i) => i.createdAt.toISOString().split('T')[0])
  ).size
  const totalDays = 90

  // Support tickets (assuming there's a support ticket system)
  // For now, we'll use interactions with type 'support'
  const supportInteractions = await prisma.interaction.findMany({
    where: {
      contactId,
      tenantId,
      type: 'support',
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  // Payment history (assuming there's an invoice/payment system)
  const invoices = await prisma.invoice.findMany({
    where: {
      contactId,
      tenantId,
    },
    select: {
      status: true,
      dueDate: true,
      paidAt: true,
      createdAt: true,
    },
  })

  const totalPayments = invoices.length
  const onTimePayments = invoices.filter(
    (inv) => inv.status === 'paid' && inv.paidAt && inv.paidAt <= inv.dueDate
  ).length
  const latePayments = invoices.filter(
    (inv) => inv.status === 'paid' && inv.paidAt && inv.paidAt > inv.dueDate
  ).length
  const daysOverdue = invoices
    .filter((inv) => inv.status === 'unpaid' && inv.dueDate < now)
    .reduce((sum, inv) => {
      const days = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

  // Engagement metrics
  const emailInteractions = await prisma.interaction.findMany({
    where: {
      contactId,
      tenantId,
      type: 'email',
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      metadata: true,
    },
  })

  const emailOpens = emailInteractions.filter(
    (e) => (e.metadata as any)?.emailOpened === true
  ).length
  const emailOpenRate = emailInteractions.length > 0 ? (emailOpens / emailInteractions.length) * 100 : 0

  // Last login (if user account exists)
  const user = await prisma.user.findFirst({
    where: {
      email: contact.email,
      tenantId,
    },
    select: { lastLoginAt: true },
  })

  const lastLoginDays = user?.lastLoginAt
    ? Math.floor((now.getTime() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // Sentiment (NPS, feedback)
  // This would come from surveys/feedback system
  // For now, placeholder
  const npsScore = null
  const feedbackSentiment: 'positive' | 'neutral' | 'negative' | null = null

  return {
    usage: {
      activeDays,
      totalDays,
      usagePercentage: (activeDays / totalDays) * 100,
      featuresUsed: 5, // Placeholder - would calculate from actual feature usage
      totalFeatures: 10, // Placeholder
    },
    support: {
      ticketCount: supportInteractions.length,
      recentTickets: supportInteractions.filter((i) => i.createdAt >= thirtyDaysAgo).length,
      avgResolutionTime: 24, // Placeholder - would calculate from actual resolution times
      satisfactionScore: 0, // Placeholder
    },
    payment: {
      onTimePayments,
      totalPayments,
      latePayments,
      daysOverdue,
      paymentReliability: totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 100,
    },
    engagement: {
      emailOpenRate,
      featureAdoption: 50, // Placeholder
      loginFrequency: lastLoginDays < 7 ? 7 : lastLoginDays < 30 ? 3 : 1,
      lastLoginDays,
    },
    sentiment: {
      npsScore,
      feedbackSentiment,
      recentFeedback: [], // Placeholder
    },
  }
}

/**
 * Calculate usage score (0-100)
 */
function calculateUsageScore(usage: HealthScoreComponents['usage']): number {
  const usageWeight = 0.6
  const featureWeight = 0.4

  const usageScore = Math.min(100, (usage.usagePercentage / 100) * 100)
  const featureScore = usage.totalFeatures > 0
    ? (usage.featuresUsed / usage.totalFeatures) * 100
    : 50

  return usageScore * usageWeight + featureScore * featureWeight
}

/**
 * Calculate support score (0-100)
 */
function calculateSupportScore(support: HealthScoreComponents['support']): number {
  let score = 100

  // Deduct for recent tickets
  score -= support.recentTickets * 10

  // Deduct for slow resolution
  if (support.avgResolutionTime > 48) {
    score -= 20
  }

  // Add for high satisfaction
  if (support.satisfactionScore > 8) {
    score += 10
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate payment score (0-100)
 */
function calculatePaymentScore(payment: HealthScoreComponents['payment']): number {
  let score = payment.paymentReliability

  // Deduct for overdue days
  if (payment.daysOverdue > 0) {
    score -= Math.min(30, payment.daysOverdue * 2)
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate engagement score (0-100)
 */
function calculateEngagementScore(engagement: HealthScoreComponents['engagement']): number {
  const emailWeight = 0.4
  const loginWeight = 0.4
  const featureWeight = 0.2

  const emailScore = Math.min(100, engagement.emailOpenRate * 2)
  const loginScore = engagement.lastLoginDays < 7 ? 100 : engagement.lastLoginDays < 30 ? 70 : 30
  const featureScore = engagement.featureAdoption

  return emailScore * emailWeight + loginScore * loginWeight + featureScore * featureWeight
}

/**
 * Calculate sentiment score (0-100)
 */
function calculateSentimentScore(sentiment: HealthScoreComponents['sentiment']): number {
  if (sentiment.npsScore !== null) {
    // Convert NPS (-100 to 100) to 0-100 scale
    return ((sentiment.npsScore + 100) / 200) * 100
  }

  if (sentiment.feedbackSentiment === 'positive') return 80
  if (sentiment.feedbackSentiment === 'neutral') return 50
  if (sentiment.feedbackSentiment === 'negative') return 20

  return 50 // Default neutral
}

/**
 * Get retention playbook actions based on risk level
 */
export function getRetentionPlaybook(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string[] {
  const playbooks: Record<string, string[]> = {
    low: [
      'Maintain regular check-ins',
      'Share product updates and new features',
      'Request case study or testimonial',
      'Offer referral incentives',
    ],
    medium: [
      'Schedule success review call',
      'Identify at-risk features and provide training',
      'Offer personalized onboarding refresh',
      'Share success stories from similar customers',
      'Provide dedicated account manager',
    ],
    high: [
      'Immediate executive outreach',
      'Conduct exit interview to understand concerns',
      'Offer discount or payment plan',
      'Provide custom solution or feature request',
      'Assign senior account manager',
      'Schedule weekly check-ins',
    ],
    critical: [
      'URGENT: CEO/Founder direct outreach',
      'Offer significant discount or pause billing',
      'Conduct emergency retention call',
      'Provide immediate technical support',
      'Offer migration assistance or data export',
      'Create custom retention offer',
    ],
  }

  return playbooks[riskLevel] || []
}
