import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getFlightRiskForEmployee } from '@/lib/hr/flight-risk-service'

/**
 * GET /api/hr/employees/[id]/flight-risk
 * Calculate flight risk for an employee
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const result = await getFlightRiskForEmployee(params.id, tenantId)
    if (!result) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...result,
      calculatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
