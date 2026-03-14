import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculatePipelineHealth } from '@/lib/ai/pipeline-health'

/**
 * GET /api/crm/analytics/pipeline-health
 * Returns pipeline health metrics and recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const health = await calculatePipelineHealth(tenantId)

    return NextResponse.json({
      success: true,
      data: health,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error calculating pipeline health:', error)
    return NextResponse.json(
      { error: 'Failed to calculate pipeline health' },
      { status: 500 }
    )
  }
}
