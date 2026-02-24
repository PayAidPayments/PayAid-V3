/**
 * POST /api/agents/workflows/[id]/run — manual run
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { executeWorkflow } from '@/lib/agents/workflow-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const result = await executeWorkflow(id, {
      tenantId,
      workflowId: id,
      payload: body,
    })
    return NextResponse.json(result)
  } catch (e) {
    console.error('Workflow run error:', e)
    return NextResponse.json(
      { error: 'Run failed', details: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}
