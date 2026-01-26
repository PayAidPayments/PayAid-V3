import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const quoteId = params.id
    const body = await request.json()
    const { action, comments } = body // action: 'approve' | 'reject'

    // Find the pending approval for this user
    const approval = await prisma.quoteApproval.findFirst({
      where: {
        quoteId,
        approverId: userId,
        status: 'PENDING',
      },
      include: {
        quote: true,
      },
    })

    if (!approval) {
      return NextResponse.json(
        { error: 'No pending approval found for this user' },
        { status: 404 }
      )
    }

    // Update approval status
    await prisma.quoteApproval.update({
      where: { id: approval.id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        comments,
        ...(action === 'approve' ? { approvedAt: new Date() } : { rejectedAt: new Date() }),
      },
    })

    // Check if all approvals are complete
    const allApprovals = await prisma.quoteApproval.findMany({
      where: { quoteId },
    })

    const allApproved = allApprovals.every((a) => a.status === 'APPROVED')
    const anyRejected = allApprovals.some((a) => a.status === 'REJECTED')

    // Update quote status
    if (anyRejected) {
      await prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'rejected' },
      })
    } else if (allApproved) {
      await prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'sent' }, // Ready to send after all approvals
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        approvalId: approval.id,
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        quoteStatus: anyRejected ? 'rejected' : allApproved ? 'sent' : 'pending_approval',
      },
    })
  } catch (error) {
    console.error('[Quote Approve API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}
