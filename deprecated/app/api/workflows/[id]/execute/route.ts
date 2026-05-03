import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { executeWorkflow } from '@/lib/workflows/executor'

// POST /api/workflows/[id]/execute - Execute workflow manually
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const triggerData = body.triggerData || {}

    // Execute the workflow
    await executeWorkflow(params.id, triggerData)

    return NextResponse.json({ success: true, message: 'Workflow executed successfully' })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Execute workflow error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}

