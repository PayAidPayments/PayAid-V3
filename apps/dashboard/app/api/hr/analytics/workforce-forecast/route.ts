import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getWorkforceForecast } from '@/lib/hr/workforce-forecast'

/**
 * GET /api/hr/analytics/workforce-forecast
 * Feature #5: Predictive Workforce Planning. 12-month historical headcount + 6-month forecast (linear), skill-gap note.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const result = await getWorkforceForecast(tenantId)
    return NextResponse.json(result)
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
