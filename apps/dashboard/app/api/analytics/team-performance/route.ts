import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/analytics/team-performance
 * Get team performance metrics and leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    // Check Analytics module license
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'month' // today, week, month, year

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1))
    }

    // Get all sales reps
    const reps = await prisma.salesRep.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        assignedLeads: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
        },
        deals: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
        },
        interactions: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
    })

    // Calculate metrics for each rep
    const performance = reps.map((rep) => {
      const callsMade = rep.interactions.filter((i) => i.type === 'call').length
      const emailsSent = rep.interactions.filter((i) => i.type === 'email').length
      const meetingsScheduled = rep.interactions.filter((i) => i.type === 'meeting').length

      const wonDeals = rep.deals.filter((d) => d.stage === 'won')
      const dealsClosed = wonDeals.length
      const revenue = wonDeals.reduce((sum, d) => sum + d.value, 0)
      const totalDeals = rep.deals.length
      const conversionRate = totalDeals > 0 ? (dealsClosed / totalDeals) * 100 : 0
      const closeRate = rep.assignedLeads.length > 0
        ? (dealsClosed / rep.assignedLeads.length) * 100
        : 0

      return {
        repId: rep.id,
        name: rep.user.name,
        email: rep.user.email,
        specialization: rep.specialization,
        metrics: {
          callsMade,
          emailsSent,
          meetingsScheduled,
          dealsClosed,
          revenue,
          conversionRate: conversionRate.toFixed(1),
          closeRate: closeRate.toFixed(1),
          assignedLeads: rep.assignedLeads.length,
        },
      }
    })

    // Sort by revenue for leaderboard
    const leaderboard = [...performance].sort(
      (a, b) => b.metrics.revenue - a.metrics.revenue
    )

    // Calculate team totals
    const teamTotals = {
      callsMade: performance.reduce((sum, r) => sum + r.metrics.callsMade, 0),
      emailsSent: performance.reduce((sum, r) => sum + r.metrics.emailsSent, 0),
      meetingsScheduled: performance.reduce(
        (sum, r) => sum + r.metrics.meetingsScheduled,
        0
      ),
      dealsClosed: performance.reduce((sum, r) => sum + r.metrics.dealsClosed, 0),
      revenue: performance.reduce((sum, r) => sum + r.metrics.revenue, 0),
      avgConversionRate:
        performance.length > 0
          ? (
              performance.reduce(
                (sum, r) => sum + parseFloat(r.metrics.conversionRate),
                0
              ) / performance.length
            ).toFixed(1)
          : '0',
    }

    return NextResponse.json({
      period,
      teamTotals,
      leaderboard: leaderboard.map((rep, index) => ({
        rank: index + 1,
        ...rep,
      })),
      performance,
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get team performance error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get team performance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
