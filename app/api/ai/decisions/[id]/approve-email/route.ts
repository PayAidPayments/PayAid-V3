import { NextRequest, NextResponse } from 'next/server'
import { validateApprovalToken } from '@/lib/notifications/decision-notifications'
import { prisma } from '@/lib/db/prisma'
import { executeDecision } from '@/lib/ai/decision-executor'

/**
 * GET /api/ai/decisions/[id]/approve-email
 * Email approval endpoint (token-based)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const action = searchParams.get('action') // 'approve' or 'reject'

    if (!token || !action) {
      return NextResponse.json(
        { error: 'Token and action are required' },
        { status: 400 }
      )
    }

    // Validate token
    const validation = await validateApprovalToken(token, params.id)
    if (!validation.valid || !validation.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Get decision
    const decision = await prisma.aIDecision.findUnique({
      where: { id: params.id },
      include: { approvalQueue: true },
    })

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (decision.status !== 'pending') {
      return NextResponse.json(
        { error: 'Decision is not pending approval' },
        { status: 400 }
      )
    }

    // Mark token as used
    await prisma.approvalToken.updateMany({
      where: { token, decisionId: params.id },
      data: { used: true, usedAt: new Date() },
    })

    if (action === 'approve') {
      // Update decision
      await prisma.aIDecision.update({
        where: { id: params.id },
        data: {
          approvedBy: validation.userId,
          approvedAt: new Date(),
        },
      })

      // Update approval queue
      if (decision.approvalQueue) {
        const updatedApprovers = [
          ...decision.approvalQueue.approvedBy,
          validation.userId,
        ].filter((id, index, arr) => arr.indexOf(id) === index)

        await prisma.approvalQueue.update({
          where: { decisionId: params.id },
          data: {
            approvedBy: updatedApprovers,
          },
        })

        // Check if all approvals received
        const updatedQueue = await prisma.approvalQueue.findUnique({
          where: { decisionId: params.id },
        })

        if (
          updatedQueue &&
          updatedQueue.approvedBy.length >= updatedQueue.requiredApprovers.length
        ) {
          // All approvals received, execute
          const executionResult = await executeDecision({
            id: decision.id,
            type: decision.type,
            description: decision.description,
            recommendation: decision.recommendation as any,
            metadata: {},
            tenantId: decision.tenantId,
            requestedBy: decision.requestedBy,
          })

          await prisma.aIDecision.update({
            where: { id: params.id },
            data: {
              status: 'executed',
              executionResult: executionResult as any,
              executedAt: new Date(),
            },
          })
        }
      }
    } else if (action === 'reject') {
      await prisma.aIDecision.update({
        where: { id: params.id },
        data: {
          status: 'rejected',
        },
      })

      if (decision.approvalQueue) {
        await prisma.approvalQueue.update({
          where: { decisionId: params.id },
          data: {
            rejectedBy: [...decision.approvalQueue.rejectedBy, validation.userId],
          },
        })
      }
    }

    // Return success page HTML
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Decision ${action === 'approve' ? 'Approved' : 'Rejected'}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: green; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="${action === 'approve' ? 'success' : 'error'}">
            Decision ${action === 'approve' ? 'Approved' : 'Rejected'} Successfully
          </h1>
          <p>Decision ID: ${params.id}</p>
          <p>Type: ${decision.type.replace(/_/g, ' ')}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `

    return new NextResponse(successHtml, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('Email approval error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval', details: String(error) },
      { status: 500 }
    )
  }
}
