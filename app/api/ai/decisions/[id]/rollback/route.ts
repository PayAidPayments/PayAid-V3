import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { rollbackDecision } from '@/lib/ai/decision-executor'
import { trackDecisionOutcome } from '@/lib/ai/risk-policy-manager'

/**
 * POST /api/ai/decisions/[id]/rollback
 * Rollback an executed decision
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const decision = await prisma.aIDecision.findUnique({
      where: { id: params.id, tenantId },
    })

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    if (!decision.rollbackable) {
      return NextResponse.json(
        { error: 'Decision cannot be rolled back' },
        { status: 400 }
      )
    }

    if (decision.status !== 'executed') {
      return NextResponse.json(
        { error: 'Only executed decisions can be rolled back' },
        { status: 400 }
      )
    }

    // Rollback the decision
    const rollbackResult = await rollbackDecision(
      {
        id: decision.id,
        type: decision.type,
        description: decision.description,
        recommendation: decision.recommendation as any,
        metadata: {},
        tenantId,
        requestedBy: decision.requestedBy,
      },
      decision.executionResult
    )

    if (!rollbackResult.success) {
      return NextResponse.json(
        { error: rollbackResult.message },
        { status: 400 }
      )
    }

    // Update decision status
    await prisma.aIDecision.update({
      where: { id: params.id },
      data: {
        status: 'rolled_back',
        rolledBackAt: new Date(),
      },
    })

    // Track outcome
    await trackDecisionOutcome({
      decisionId: decision.id,
      tenantId: decision.tenantId,
      decisionType: decision.type as any,
      riskScore: decision.riskScore,
      approvalLevel: decision.approvalLevel,
      status: 'rolled_back',
      wasApproved: decision.status === 'executed',
      wasRejected: false,
      wasRolledBack: true,
      executionSuccess: false,
      executionError: 'Decision rolled back',
      createdAt: new Date(),
    })

    const updatedDecision = await prisma.aIDecision.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      decision: updatedDecision,
      rollbackResult,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Rollback decision error:', error)
    return NextResponse.json(
      { error: 'Failed to rollback decision', details: String(error) },
      { status: 500 }
    )
  }
}
