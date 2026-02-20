import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { runWorkflow } from '@/lib/workflow/engine'

/** POST /api/workflows/[id]/run - Manually run a workflow with optional trigger data */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const data = body.data || body.triggerData || {}

    const result = await runWorkflow(id, {
      tenantId,
      event: 'manual',
      data,
    })

    return NextResponse.json({
      executionId: result.executionId,
      status: result.status,
      error: result.error,
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] workflows/[id]/run POST', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to run workflow' },
      { status: 500 }
    )
  }
}
