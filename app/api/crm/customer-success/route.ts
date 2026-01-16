import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// Helper function to calculate customer health score
function calculateHealthScore(customer: any): number {
  let score = 50 // Base score

  // Factors that increase health:
  // - Recent activity (+20 points)
  if (customer.lastActivityDate) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(customer.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceActivity <= 7) score += 20
    else if (daysSinceActivity <= 30) score += 10
  }

  // - Has deals (+15 points)
  if (customer.dealsCount > 0) score += 15

  // - Has tasks/activities (+10 points)
  if (customer.tasksCount > 0 || customer.activitiesCount > 0) score += 10

  // - High lifetime value (+5 points)
  if (customer.totalValue > 100000) score += 5

  // Factors that decrease health:
  // - No activity in 90+ days (-30 points)
  if (customer.lastActivityDate) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(customer.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceActivity > 90) score -= 30
    else if (daysSinceActivity > 60) score -= 15
  } else {
    score -= 20 // No activity data
  }

  // - Overdue invoices (-20 points)
  if (customer.overdueInvoices > 0) score -= 20

  // - No deals (-15 points)
  if (customer.dealsCount === 0) score -= 15

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score))
}

// Helper function to determine customer status
function getCustomerStatus(healthScore: number, churnRisk: number): 'healthy' | 'at-risk' | 'critical' {
  if (healthScore >= 70 && churnRisk < 25) return 'healthy'
  if (healthScore >= 40 && churnRisk < 50) return 'at-risk'
  return 'critical'
}

// Helper function to calculate churn risk
function calculateChurnRisk(customer: any, healthScore: number): number {
  let risk = 0

  // Base risk from health score (inverse)
  risk += (100 - healthScore) * 0.3

  // No activity increases risk
  if (customer.lastActivityDate) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(customer.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceActivity > 90) risk += 40
    else if (daysSinceActivity > 60) risk += 25
    else if (daysSinceActivity > 30) risk += 10
  } else {
    risk += 30
  }

  // Overdue invoices increase risk
  if (customer.overdueInvoices > 0) risk += 20

  // No deals increase risk
  if (customer.dealsCount === 0) risk += 15

  return Math.min(100, Math.round(risk))
}

// GET /api/crm/customer-success - Get customer success data
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get all customers (contacts with stage='customer')
    const customers = await prisma.contact.findMany({
      where: {
        tenantId,
        stage: 'customer',
      },
      include: {
        deals: {
          select: {
            id: true,
            value: true,
            stage: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        invoices: {
          select: {
            id: true,
            status: true,
            dueDate: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Calculate health metrics for each customer
    const customerHealth = customers.map(customer => {
      const dealsCount = customer.deals?.length || 0
      const totalValue = customer.deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0
      const overdueInvoices = customer.invoices?.filter(
        inv => inv.status === 'unpaid' && inv.dueDate && new Date(inv.dueDate) < new Date()
      ).length || 0

      // Get last activity date (from deals or invoices)
      const lastDealDate = customer.deals?.[0]?.createdAt
      const lastInvoiceDate = customer.invoices?.[0]?.createdAt
      const lastActivityDate = lastDealDate && lastInvoiceDate
        ? (new Date(lastDealDate) > new Date(lastInvoiceDate) ? lastDealDate : lastInvoiceDate)
        : (lastDealDate || lastInvoiceDate)

      const healthScore = calculateHealthScore({
        lastActivityDate,
        dealsCount,
        tasksCount: 0, // Can be enhanced with actual task count
        activitiesCount: 0, // Can be enhanced with actual activity count
        totalValue,
        overdueInvoices,
      })

      const churnRisk = calculateChurnRisk({
        lastActivityDate,
        dealsCount,
        overdueInvoices,
      }, healthScore)

      const status = getCustomerStatus(healthScore, churnRisk)

      // Calculate MRR (Monthly Recurring Revenue) - simplified
      // Use invoice total or deal value, whichever is higher
      // In production, this should come from subscription data
      const mrr = Math.max(totalInvoiceValue, totalValue) > 0 
        ? Math.max(totalInvoiceValue, totalValue) / 12 
        : 0 // Assume annual value, convert to monthly

      // Calculate renewal date (simplified - 1 year from last deal or invoice)
      const renewalDate = lastActivityDate
        ? new Date(new Date(lastActivityDate).setFullYear(new Date(lastActivityDate).getFullYear() + 1))
        : null

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        healthScore,
        status,
        mrr,
        lastActivity: lastActivityDate ? new Date(lastActivityDate).toISOString() : '',
        renewalDate: renewalDate ? renewalDate.toISOString() : '',
        churnRisk,
        lifetimeValue: totalValue,
      }
    })

    // Calculate aggregate stats
    const stats = {
      totalCustomers: customerHealth.length,
      healthyCustomers: customerHealth.filter(c => c.status === 'healthy').length,
      atRiskCustomers: customerHealth.filter(c => c.status === 'at-risk').length,
      criticalCustomers: customerHealth.filter(c => c.status === 'critical').length,
      totalMRR: customerHealth.reduce((sum, c) => sum + c.mrr, 0),
      renewalRate: customerHealth.length > 0
        ? (customerHealth.filter(c => c.churnRisk < 25).length / customerHealth.length) * 100
        : 0,
      churnRate: customerHealth.length > 0
        ? (customerHealth.filter(c => c.churnRisk > 50).length / customerHealth.length) * 100
        : 0,
      averageHealthScore: customerHealth.length > 0
        ? customerHealth.reduce((sum, c) => sum + c.healthScore, 0) / customerHealth.length
        : 0,
    }

    return NextResponse.json({
      stats,
      customers: customerHealth.sort((a, b) => {
        // Sort by status priority (critical first, then at-risk, then healthy)
        const statusOrder = { critical: 0, 'at-risk': 1, healthy: 2 }
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status]
        }
        // Then by health score (lowest first)
        return a.healthScore - b.healthScore
      }),
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Customer success error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer success data', message: error?.message },
      { status: 500 }
    )
  }
}
