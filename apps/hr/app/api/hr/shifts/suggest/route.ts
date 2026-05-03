import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/shifts/suggest
 * Feature #9: Intelligent Shift Scheduling. Returns active shifts; optimal assignment requires preferences and coverage rules.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const shifts = await prisma.shift.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, startTime: true, endTime: true, breakDuration: true },
    })
    return NextResponse.json({
      shifts,
      note: 'Optimal shift assignment (minimize overtime, maximize coverage) requires employee preferences and coverage rules. Use shift list for manual assignment; integrate constraint solver when preferences dataset is available.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
