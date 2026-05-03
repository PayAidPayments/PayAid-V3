import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { getSmartLeaveBalance } from '@/lib/hr/smart-leave-balance'

/** GET /api/hr/leave/smart-balance?employeeId=xxx - Feature #7 Smart Leave Balance */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const employeeId = request.nextUrl.searchParams.get('employeeId')
    if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
    const result = await getSmartLeaveBalance(tenantId, employeeId)
    return NextResponse.json(result)
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
