import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/crm/deals/pipeline-snapshot
 * Returns deals count by stage for pipeline snapshot
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        stage: { notIn: ['won', 'lost'] },
      },
      select: { stage: true },
    })

    // Count deals by stage
    const snapshot: Record<string, number> = {}
    for (const deal of deals) {
      snapshot[deal.stage] = (snapshot[deal.stage] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error fetching pipeline snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline snapshot' },
      { status: 500 }
    )
  }
}
