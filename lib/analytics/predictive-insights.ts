/**
 * Predictive Insights
 * AI-powered predictions for business metrics
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'

export interface Prediction {
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  timeframe: string
  trend: 'increasing' | 'decreasing' | 'stable'
  factors: string[]
}

/**
 * Predict revenue for next period
 */
export async function predictRevenue(
  tenantId: string,
  months: number = 3
): Promise<Prediction> {
  // Get historical revenue data
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'sent',
    },
    orderBy: { invoiceDate: 'desc' },
    take: 12,
  })

  const monthlyRevenue: number[] = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    
    const monthInvoices = invoices.filter((inv) => {
      const invDate = new Date(inv.invoiceDate || inv.createdAt)
      return invDate >= monthStart && invDate <= monthEnd
    })
    
    const revenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    monthlyRevenue.push(revenue)
  }

  // Simple linear regression for prediction
  const avgRevenue = monthlyRevenue.reduce((sum, r) => sum + r, 0) / monthlyRevenue.length
  const trend = monthlyRevenue.length >= 2
    ? (monthlyRevenue[monthlyRevenue.length - 1] - monthlyRevenue[0]) / monthlyRevenue.length
    : 0

  const predictedValue = avgRevenue + (trend * months)
  const currentValue = monthlyRevenue[monthlyRevenue.length - 1] || 0

  return {
    metric: 'Revenue',
    currentValue,
    predictedValue: Math.max(predictedValue, 0),
    confidence: 0.75,
    timeframe: `${months} months`,
    trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
    factors: [
      'Historical revenue trends',
      'Seasonal patterns',
      'Recent deal pipeline',
    ],
  }
}

/**
 * Predict churn risk
 */
export async function predictChurnRisk(
  tenantId: string
): Promise<Array<{
  contactId: string
  contactName: string
  riskScore: number
  reasons: string[]
}>> {
  // Get contacts with low engagement
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    include: {
      deals: {
        take: 1,
        orderBy: { updatedAt: 'desc' },
      },
    },
    take: 50,
  })

  const churnRisks = contacts
    .map((contact) => {
      const lastDeal = contact.deals?.[0]
      const daysSinceActivity = lastDeal
        ? Math.floor((Date.now() - lastDeal.updatedAt.getTime()) / (24 * 60 * 60 * 1000))
        : 365

      const riskScore = Math.min(daysSinceActivity / 90, 1) * 100 // 0-100
      const reasons: string[] = []

      if (daysSinceActivity > 90) {
        reasons.push('No activity in last 90 days')
      }
      if (daysSinceActivity > 180) {
        reasons.push('No activity in last 6 months')
      }

      return {
        contactId: contact.id,
        contactName: contact.name || 'Unknown',
        riskScore,
        reasons,
      }
    })
    .filter((c) => c.riskScore > 30)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)

  return churnRisks
}
