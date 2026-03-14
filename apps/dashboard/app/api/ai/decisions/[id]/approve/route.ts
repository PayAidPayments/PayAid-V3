import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { executeDecision } from '@/lib/ai/decision-executor'
import { trackDecisionOutcome } from '@/lib/ai/risk-policy-manager'
import { z } from 'zod'

const approveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional(),
})

/**
 * PATCH /api/ai/decisions/[id]/approve
 * Approve or reject a decision
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = approveSchema.parse(body)

    // Get decision
    const decision = await prisma.aIDecision.findUnique({
      where: { id: params.id, tenantId },
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

    if (validated.action === 'approve') {
      // Update decision
      await prisma.aIDecision.update({
        where: { id: params.id },
        data: {
          approvedBy: userId,
          approvedAt: new Date(),
        },
      })

      // Update approval queue
      if (decision.approvalQueue) {
        const updatedApprovers = [
          ...decision.approvalQueue.approvedBy,
          userId,
        ].filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates

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
            tenantId,
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

          // Track outcome
          await trackDecisionOutcome({
            decisionId: decision.id,
            tenantId: decision.tenantId,
            decisionType: decision.type as any,
            riskScore: decision.riskScore,
            approvalLevel: decision.approvalLevel,
            status: 'executed',
            wasApproved: true,
            wasRejected: false,
            wasRolledBack: false,
            executionSuccess: executionResult.success,
            executionError: executionResult.error,
            createdAt: new Date(),
          })
        } else {
          // Partial approval, update status
          await prisma.aIDecision.update({
            where: { id: params.id },
            data: {
              status: 'approved', // Partial approval
            },
          })
        }
      } else {
        // No approval queue (shouldn't happen, but handle gracefully)
        // Execute directly
        const executionResult = await executeDecision({
          id: decision.id,
          type: decision.type,
          description: decision.description,
          recommendation: decision.recommendation as any,
          metadata: {},
          tenantId,
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

        // Track outcome
        await trackDecisionOutcome({
          decisionId: decision.id,
          tenantId: decision.tenantId,
          decisionType: decision.type as any,
          riskScore: decision.riskScore,
          approvalLevel: decision.approvalLevel,
          status: 'executed',
          wasApproved: true,
          wasRejected: false,
          wasRolledBack: false,
          executionSuccess: executionResult.success,
          executionError: executionResult.error,
          createdAt: new Date(),
        })
      }
    } else if (validated.action === 'reject') {
      // Reject decision
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
            rejectedBy: [...decision.approvalQueue.rejectedBy, userId],
          },
        })
      }

      // Track outcome
      await trackDecisionOutcome({
        decisionId: decision.id,
        tenantId: decision.tenantId,
        decisionType: decision.type as any,
        riskScore: decision.riskScore,
        approvalLevel: decision.approvalLevel,
        status: 'rejected',
        wasApproved: false,
        wasRejected: true,
        wasRolledBack: false,
        executionSuccess: false,
        executionError: `Rejected by ${userId}: ${validated.comment || 'No comment provided'}`,
        createdAt: new Date(),
      })

      // Notify requester and Co-Founder about rejection
      const { notifyDecisionExecution } = await import('@/lib/notifications/decision-notifications')
      await notifyDecisionExecution(decision, false, `Decision rejected by ${userId}. ${validated.comment || 'No comment provided.'}`)
    }

    const updatedDecision = await prisma.aIDecision.findUnique({
      where: { id: params.id },
      include: { approvalQueue: true },
    })

    return NextResponse.json({
      success: true,
      decision: updatedDecision,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Approve/reject decision error:', error)
    return NextResponse.json(
      { error: 'Failed to process approval', details: String(error) },
      { status: 500 }
    )
  }
}
