import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createApprovalWorkflowSchema = z.object({
  approvers: z.array(
    z.object({
      approverId: z.string(),
      approverName: z.string(),
      approverEmail: z.string().email(),
      approvalOrder: z.number().int().min(1),
    })
  ).min(1),
})

/**
 * GET /api/contracts/[id]/approvals
 * Get approval workflow for a contract
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'contract-management')

    const contract = await prisma.contract.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        approvals: {
          orderBy: { approvalOrder: 'asc' },
        },
      },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      contract: {
        id: contract.id,
        title: contract.title,
        status: contract.status,
        requiresApproval: contract.requiresApproval,
      },
      approvals: contract.approvals,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get contract approvals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts/[id]/approvals
 * Create approval workflow for a contract
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'contract-management')

    const body = await request.json()
    const validated = createApprovalWorkflowSchema.parse(body)

    const contract = await prisma.contract.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    if (contract.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Approval workflow can only be created for draft contracts' },
        { status: 400 }
      )
    }

    // Create approval records
    const approvals = await Promise.all(
      validated.approvers.map((approver) =>
        prisma.contractApproval.create({
          data: {
            contractId: contract.id,
            approverId: approver.approverId,
            approverName: approver.approverName,
            approverEmail: approver.approverEmail,
            approvalOrder: approver.approvalOrder,
            status: 'PENDING',
          },
        })
      )
    )

    // Update contract to require approval
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        requiresApproval: true,
        status: 'PENDING_APPROVAL',
        approvalWorkflow: {
          approvers: validated.approvers,
          createdAt: new Date(),
        },
      },
    })

    return NextResponse.json({
      approvals,
      message: 'Approval workflow created',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create approval workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to create approval workflow' },
      { status: 500 }
    )
  }
}

