import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const quoteId = params.id
    const body = await request.json()
    const { workflow } = body

    // Verify quote exists and belongs to tenant
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Update quote with approval workflow
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        requiresApproval: true,
        approvalWorkflow: workflow,
        status: 'pending_approval',
      },
    })

    // Create approval records
    const approvals = await Promise.all(
      workflow.map((step: any) =>
        prisma.quoteApproval.create({
          data: {
            quoteId,
            approverId: step.approverId,
            approverName: step.approverName,
            approverEmail: step.approverEmail,
            approvalOrder: step.order,
            status: 'PENDING',
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: {
        quoteId,
        approvals,
      },
    })
  } catch (error) {
    console.error('[Quote Approval Workflow API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create approval workflow' },
      { status: 500 }
    )
  }
}
