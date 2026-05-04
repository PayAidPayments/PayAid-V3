import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { decideWorkflowApproval } from '@/lib/workflow/approvals'

const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().optional(),
  approvedStepIds: z.array(z.string()).optional(),
})

// POST /api/automation/workflows/approvals/[executionId]/decision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const { executionId } = await params
    const body = await request.json()
    const validated = decisionSchema.parse(body)

    const result = await decideWorkflowApproval({
      tenantId,
      executionId,
      decision: validated.decision,
      userId,
      note: validated.note,
      approvedStepIds: validated.approvedStepIds,
    })

    return NextResponse.json({ success: true, result })
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

    const message = error instanceof Error ? error.message : 'Failed to decide workflow approval'
    const status = /not found/i.test(message) ? 404 : /not pending/i.test(message) ? 409 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
