import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { runCycleValidation } from '@/lib/hr/payroll-auto-process'

/**
 * GET /api/hr/payroll/cycles/[id]/validate
 * Full validation: salary structures, attendance, statutory checks, anomaly detection (Phase 1.3).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id: cycleId } = await params

    const result = await runCycleValidation(tenantId, cycleId)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    const msg = error instanceof Error ? error.message : 'Validation failed'
    if (msg === 'Payroll cycle not found') {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    console.error('Validate cycle error:', error)
    return NextResponse.json(
      { error: 'Validation failed', message: msg },
      { status: 500 }
    )
  }
}
