import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { runCycleValidation, runBulkGenerate } from '@/lib/hr/payroll-auto-process'

/**
 * POST /api/hr/payroll/cycles/[id]/process
 * One-click auto-payroll: validate then generate (Phase 1.3).
 * Query: skipValidation=true to generate without blocking on validation; force=true to generate even when validation has errors.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id: cycleId } = await params

    const { searchParams } = new URL(request.url)
    const skipValidation = searchParams.get('skipValidation') === 'true'
    const force = searchParams.get('force') === 'true'

    let validation = null
    if (!skipValidation) {
      validation = await runCycleValidation(tenantId, cycleId)
      if (!validation.isValid && !force) {
        return NextResponse.json(
          {
            message: 'Validation failed. Fix errors before processing or use ?force=true to proceed.',
            validation,
            generated: null,
          },
          { status: 400 }
        )
      }
    }

    const result = await runBulkGenerate(tenantId, cycleId)

    return NextResponse.json({
      message: `Processed: ${result.created} created, ${result.skipped} skipped, ${result.errors.length} errors`,
      validation: validation ?? undefined,
      generated: {
        created: result.created,
        skipped: result.skipped,
        errors: result.errors,
      },
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    const msg = error instanceof Error ? error.message : 'Process failed'
    if (msg === 'Payroll cycle not found') {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    if (msg.includes('locked') || msg.includes('paid')) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    console.error('Payroll process error:', error)
    return NextResponse.json({ error: 'Process failed', message: msg }, { status: 500 })
  }
}
