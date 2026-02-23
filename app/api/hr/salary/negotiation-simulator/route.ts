import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { runSalaryNegotiationSimulator } from '@/lib/hr/salary-negotiation-simulator'

/**
 * POST /api/hr/salary/negotiation-simulator
 * Feature #3: Auto-Salary Negotiation Simulator. Body: designationId?, departmentId?, currentOfferInr?, experienceYears?, isInternalCandidate?, budgetMaxInr?
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const body = await request.json().catch(() => ({}))
    const result = await runSalaryNegotiationSimulator({
      tenantId,
      designationId: body.designationId ?? null,
      departmentId: body.departmentId ?? null,
      currentOfferInr: body.currentOfferInr != null ? Number(body.currentOfferInr) : null,
      experienceYears: body.experienceYears != null ? Number(body.experienceYears) : null,
      isInternalCandidate: Boolean(body.isInternalCandidate),
      budgetMaxInr: body.budgetMaxInr != null ? Number(body.budgetMaxInr) : null,
    })
    return NextResponse.json(result)
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
