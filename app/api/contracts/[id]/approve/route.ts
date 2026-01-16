import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const approveContractSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comments: z.string().optional(),
})

/**
 * POST /api/contracts/[id]/approve
 * Approve or reject a contract in the approval workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'contract-management')
    const contractId = params.id

    const body = await request.json()
    const validated = approveContractSchema.parse(body)

    // Get contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        approvals: {
          orderBy: { approvalOrder: 'asc' },
        },
      },
    })

    if (!contract || contract.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    if (!contract.requiresApproval) {
      return NextResponse.json(
        { error: 'This contract does not require approval' },
        { status: 400 }
      )
    }

    // Find the current approver's approval record
    const userApproval = contract.approvals.find(
      (a) => a.approverId === userId && a.status === 'PENDING'
    )

    if (!userApproval) {
      return NextResponse.json(
        { error: 'No pending approval found for this user' },
        { status: 400 }
      )
    }

    // Check if it's the user's turn to approve (all previous approvals must be approved)
    const userApprovalOrder = userApproval.approvalOrder
    const previousApprovals = contract.approvals.filter(
      (a) => a.approvalOrder < userApprovalOrder
    )

    const allPreviousApproved = previousApprovals.every((a) => a.status === 'APPROVED')
    if (!allPreviousApproved && previousApprovals.length > 0) {
      return NextResponse.json(
        { error: 'Previous approvals must be completed first' },
        { status: 400 }
      )
    }

    // Update approval status
    const updatedApproval = await prisma.contractApproval.update({
      where: { id: userApproval.id },
      data: {
        status: validated.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        comments: validated.comments,
        approvedAt: validated.action === 'APPROVE' ? new Date() : null,
        rejectedAt: validated.action === 'REJECT' ? new Date() : null,
      },
    })

    // If rejected, update contract status
    if (validated.action === 'REJECT') {
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({
        approval: updatedApproval,
        message: 'Contract rejected',
        contractStatus: 'REJECTED',
      })
    }

    // If approved, check if all approvals are complete
    const allApprovals = await prisma.contractApproval.findMany({
      where: { contractId },
      orderBy: { approvalOrder: 'asc' },
    })

    const allApproved = allApprovals.every((a) => a.status === 'APPROVED')
    const hasRejected = allApprovals.some((a) => a.status === 'REJECTED')

    if (hasRejected) {
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'REJECTED' },
      })
    } else if (allApproved) {
      // All approvals complete - move to pending signature
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'PENDING_SIGNATURE' },
      })
    } else {
      // Still pending other approvals
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'PENDING_APPROVAL' },
      })
    }

    return NextResponse.json({
      approval: updatedApproval,
      message: 'Contract approved',
      contractStatus: allApproved ? 'PENDING_SIGNATURE' : 'PENDING_APPROVAL',
      allApproved,
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

    console.error('Approve contract error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}

