/**
 * Workflow Execution API
 * POST /api/automation/workflows/[id]/execute - Execute a workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { executeWorkflow } from '@/lib/automation/workflow-engine'
import { z } from 'zod'

const executeSchema = z.object({
  triggerData: z.record(z.any()),
})

// POST /api/automation/workflows/[id]/execute - Execute workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const resolvedParams = await params
    const workflowId = resolvedParams.id

    const body = await request.json()
    const { triggerData } = executeSchema.parse(body)

    const result = await executeWorkflow(workflowId, triggerData, tenantId)

    return NextResponse.json({
      success: result.success,
      executedActions: result.executedActions,
      errors: result.errors,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Execute workflow error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute workflow',
      },
      { status: 500 }
    )
  }
}
