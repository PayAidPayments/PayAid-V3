import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

/**
 * GET /api/admin/analytics/churn
 * Calculate churn rate and churn prediction analytics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: auth.userId || '' },
      select: { role: true },
    })

    if (user?.role !== 'admin' && user?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)

    const now = new Date()
    const periodStart = new Date(now)
    periodStart.setDate(periodStart.getDate() - periodDays)

    // Get all active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        invoices: {
          where: {
            createdAt: {
              gte: periodStart,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        dunningAttempts: {
          where: {
            createdAt: {
              gte: periodStart,
            },
            status: 'failed',
          },
        },
      },
    })

    // Get cancelled subscriptions in period
    const cancelledSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'cancelled',
        cancelledAt: {
          gte: periodStart,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate churn rate
    const totalActive = activeSubscriptions.length
    const totalCancelled = cancelledSubscriptions.length
    const churnRate = totalActive > 0 ? (totalCancelled / totalActive) * 100 : 0

    // Identify at-risk subscriptions (multiple failed payments, approaching renewal)
    const atRiskSubscriptions = activeSubscriptions
      .filter((sub) => {
        const hasMultipleFailedPayments = sub.dunningAttempts.length >= 2
        const approachingRenewal = sub.billingCycleEnd <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        const hasUnpaidInvoices = sub.invoices.some((inv) => inv.status === 'pending' && inv.dueDate < now)

        return hasMultipleFailedPayments || (approachingRenewal && hasUnpaidInvoices)
      })
      .map((sub) => ({
        subscriptionId: sub.id,
        tenantId: sub.tenantId,
        tenantName: sub.tenant.name,
        riskScore: calculateRiskScore(sub),
        reasons: getRiskReasons(sub),
        billingCycleEnd: sub.billingCycleEnd,
      }))

    // Churn prediction (simplified)
    const churnPrediction = {
      next30Days: atRiskSubscriptions.filter(
        (sub) => sub.billingCycleEnd <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length,
      next90Days: atRiskSubscriptions.filter(
        (sub) => sub.billingCycleEnd <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      ).length,
    }

    return NextResponse.json({
      period: periodDays,
      metrics: {
        totalActive,
        totalCancelled,
        churnRate: Math.round(churnRate * 100) / 100,
        atRiskCount: atRiskSubscriptions.length,
      },
      atRiskSubscriptions,
      churnPrediction,
      cancelledSubscriptions: cancelledSubscriptions.map((sub) => ({
        subscriptionId: sub.id,
        tenantId: sub.tenantId,
        tenantName: sub.tenant.name,
        cancelledAt: sub.cancelledAt,
        cancellationReason: sub.cancellationReason,
      })),
    })
  } catch (error) {
    console.error('Churn analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate churn analytics' },
      { status: 500 }
    )
  }
}

function calculateRiskScore(subscription: any): number {
  let score = 0

  // Failed payment attempts
  score += subscription.dunningAttempts.length * 20

  // Unpaid invoices
  const unpaidInvoices = subscription.invoices.filter(
    (inv: any) => inv.status === 'pending' && inv.dueDate < new Date()
  )
  score += unpaidInvoices.length * 15

  // Approaching renewal
  const daysUntilRenewal = Math.ceil(
    (subscription.billingCycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntilRenewal <= 7) score += 30
  else if (daysUntilRenewal <= 30) score += 15

  return Math.min(score, 100) // Cap at 100
}

function getRiskReasons(subscription: any): string[] {
  const reasons: string[] = []

  if (subscription.dunningAttempts.length >= 2) {
    reasons.push('Multiple failed payment attempts')
  }

  const unpaidInvoices = subscription.invoices.filter(
    (inv: any) => inv.status === 'pending' && inv.dueDate < new Date()
  )
  if (unpaidInvoices.length > 0) {
    reasons.push(`${unpaidInvoices.length} unpaid invoice(s)`)
  }

  const daysUntilRenewal = Math.ceil(
    (subscription.billingCycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntilRenewal <= 7) {
    reasons.push('Renewal due within 7 days')
  }

  return reasons
}

