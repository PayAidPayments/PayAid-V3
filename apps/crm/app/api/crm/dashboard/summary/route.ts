import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'

/** Phase 3: Cached dashboard summary (revalidate 30s). */
async function getCachedSummary(tenantId: string) {
  return unstable_cache(
    async () => {
      const [
        totalDeals,
        activeDeals,
        totalContacts,
        pipelineValue,
        tasksDueToday,
      ] = await Promise.all([
        prisma.deal.count({
          where: { tenantId, stage: { notIn: ['won', 'lost'] } },
        }),
        prisma.deal.count({
          where: { tenantId, stage: { notIn: ['won', 'lost'] } },
        }),
        prisma.contact.count({ where: { tenantId } }),
        prisma.deal.aggregate({
          where: { tenantId, stage: { notIn: ['won', 'lost'] } },
          _sum: { value: true },
        }),
        prisma.task.count({
          where: {
            tenantId,
            status: 'pending',
            dueDate: {
              lte: new Date(),
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ])
      return {
        totalDeals,
        activeDeals,
        totalContacts,
        pipelineValue: Number(pipelineValue._sum.value || 0),
        tasksDueToday,
      }
    },
    ['crm-dashboard-summary', tenantId],
    { revalidate: 30 }
  )()
}

/**
 * GET /api/crm/dashboard/summary
 * Returns dashboard summary data for mobile app. Phase 3: ISR cache + Cache-Control.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const data = await getCachedSummary(tenantId)

    const res = NextResponse.json({ success: true, data })
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error fetching dashboard summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    )
  }
}
