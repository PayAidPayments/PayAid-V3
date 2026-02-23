import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getAttritionRisk90Days } from '@/lib/hr/predictive-analytics'

/**
 * Feature #17: GET /api/hr/analytics/predictive - Attrition 90d risk; placeholders for performance/hiring.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const attrition = await getAttritionRisk90Days(tenantId)
    return NextResponse.json({
      attrition90Days: attrition,
      performancePrediction: 'Integrate performance history and ML model for excel/struggle prediction.',
      hiringSuccessPrediction: 'Integrate candidate metrics and outcome data for success probability.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
