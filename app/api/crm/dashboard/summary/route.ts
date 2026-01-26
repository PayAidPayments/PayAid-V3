import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/crm/dashboard/summary
 * Returns dashboard summary data for mobile app
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

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

    return NextResponse.json({
      success: true,
      data: {
        totalDeals,
        activeDeals,
        totalContacts,
        pipelineValue: Number(pipelineValue._sum.value || 0),
        tasksDueToday,
      },
    })
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
