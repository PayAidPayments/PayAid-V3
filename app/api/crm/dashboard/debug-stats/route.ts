import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { authenticateRequest } from '@/lib/middleware/auth'
import { getTimePeriodBounds } from '@/lib/utils/crm-filters'

/**
 * GET /api/crm/dashboard/debug-stats
 * Debug endpoint to test queries without complex logic
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireModuleAccess(request, 'crm')
    const tenantId = access.tenantId
    const user = await authenticateRequest(request)

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenantId' }, { status: 400 })
    }

    // Get period bounds
    const periodBounds = getTimePeriodBounds('month')
    const periodStart = periodBounds.start
    const periodEnd = periodBounds.end

    // Simple filters (owner sees all)
    const dealFilter = { tenantId }
    const contactFilter = { tenantId }

    // Run queries directly (no retry wrapper)
    const [
      dealsCreatedInPeriod,
      totalLeads,
      convertedLeads,
      contactsCreatedInPeriod,
      wonDeals,
    ] = await Promise.all([
      prisma.deal.count({
        where: {
          ...dealFilter,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      prisma.contact.count({
        where: {
          ...contactFilter,
          stage: { in: ['prospect', 'contact'] },
        },
      }),
      prisma.contact.count({
        where: {
          ...contactFilter,
          stage: 'customer',
        },
      }),
      prisma.contact.count({
        where: {
          ...contactFilter,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      prisma.deal.findMany({
        where: {
          ...dealFilter,
          stage: 'won',
        },
        select: {
          value: true,
          actualCloseDate: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
    ])

    const revenueInPeriod = wonDeals
      .filter(deal => {
        if (!deal) return false
        const closeDate = deal.actualCloseDate || deal.updatedAt || deal.createdAt
        if (!closeDate) return false
        const date = new Date(closeDate)
        if (isNaN(date.getTime())) return false
        const dateTime = date.getTime()
        return dateTime >= periodStart.getTime() && dateTime <= periodEnd.getTime()
      })
      .reduce((sum, deal) => sum + (deal?.value || 0), 0)

    return NextResponse.json({
      success: true,
      filters: {
        dealFilter,
        contactFilter,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
      results: {
        dealsCreatedInPeriod,
        revenueInPeriod,
        totalLeads,
        convertedLeads,
        contactsCreatedInPeriod,
        totalWonDeals: wonDeals.length,
      },
      user: {
        id: user?.userId,
        role: user?.userId ? (await prisma.user.findUnique({ where: { id: user.userId }, select: { role: true } }))?.role : 'none',
      },
    })
  } catch (error: any) {
    console.error('[DEBUG_STATS] Error:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}
