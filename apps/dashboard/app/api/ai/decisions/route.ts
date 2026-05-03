import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { calculateRiskScore, getApprovalRequirement, DecisionType } from '@/lib/ai/decision-risk'
import { executeDecision } from '@/lib/ai/decision-executor'
import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getBusinessContext } from '@/lib/ai/business-context-builder'
import { z } from 'zod'

const decisionSchema = z.object({
  type: z.string(),
  description: z.string().min(1),
  amount: z.number().optional(),
  affectedUsers: z.number().optional(),
  affectsRevenue: z.boolean().optional(),
  reversible: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * POST /api/ai/decisions
 * Create a new AI decision
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = decisionSchema.parse(body)

    // Calculate risk score (now async with company policies)
    const riskScore = await calculateRiskScore(
      {
        type: validated.type as DecisionType,
        amount: validated.amount,
        affectedUsers: validated.affectedUsers,
        affectsRevenue: validated.affectsRevenue,
        reversible: validated.reversible,
        metadata: validated.metadata,
      },
      tenantId
    )

    const approvalLevel = getApprovalRequirement(riskScore)

    // Get recommendation from Co-Founder
    const businessContext = await getBusinessContext(tenantId, validated.description)
    const systemPrompt = `You are an AI Co-Founder making a business decision.
    
Decision Type: ${validated.type}
Description: ${validated.description}
Risk Score: ${riskScore}/100

Business Context:
${businessContext}

Provide a recommendation with:
1. Your recommendation (what should be done)
2. Reasoning (why this is the best option)
3. Confidence score (0-1, how confident you are)
4. Alternative options (other options considered)

Respond in JSON format:
{
  "recommendation": "string",
  "reasoning": "string",
  "confidence": 0.0-1.0,
  "alternatives": ["option1", "option2"]
}`

    let recommendation: any
    try {
      const groq = getGroqClient()
      const response = await groq.generateCompletion(validated.description, systemPrompt)
      recommendation = JSON.parse(response)
    } catch (groqError) {
      console.warn('Groq failed for decision recommendation, trying Ollama:', groqError)
      try {
        const ollama = getOllamaClient()
        const response = await ollama.generateCompletion(validated.description, systemPrompt)
        recommendation = JSON.parse(response)
      } catch (ollamaError) {
        console.error('All AI services failed for decision recommendation:', ollamaError)
        // Fallback recommendation
        recommendation = {
          recommendation: 'Proceed with caution',
          reasoning: 'AI recommendation service unavailable',
          confidence: 0.5,
          alternatives: [],
        }
      }
    }

    // Create decision record
    const createdDecision = await prisma.aIDecision.create({
      data: {
        tenantId,
        type: validated.type,
        description: validated.description,
        riskScore,
        approvalLevel,
        recommendation,
        reasoningChain: recommendation.reasoning || '',
        alternativeOptions: recommendation.alternatives || [],
        confidenceScore: recommendation.confidence || 0.5,
        requestedBy: userId,
        status: approvalLevel === 'AUTO_EXECUTE' ? 'executed' : 'pending',
      },
    })

    // Handle execution based on approval level
    if (approvalLevel === 'AUTO_EXECUTE') {
      // Execute immediately
      const executionResult = await executeDecision({
        id: createdDecision.id,
        type: validated.type,
        description: validated.description,
        recommendation,
        metadata: validated.metadata,
        tenantId,
        requestedBy: userId,
      })

      await prisma.aIDecision.update({
        where: { id: createdDecision.id },
        data: {
          executionResult: executionResult as any,
          executedAt: new Date(),
        },
      })
    } else if (approvalLevel === 'AUDIT_LOG') {
      // Execute with logging (no approval needed)
      const executionResult = await executeDecision({
        id: createdDecision.id,
        type: validated.type,
        description: validated.description,
        recommendation,
        metadata: validated.metadata,
        tenantId,
        requestedBy: userId,
      })

      await prisma.aIDecision.update({
        where: { id: createdDecision.id },
        data: {
          executionResult: executionResult as any,
          executedAt: new Date(),
          status: 'executed',
        },
      })

      // Track outcome
      const { trackDecisionOutcome } = await import('@/lib/ai/risk-policy-manager')
      await trackDecisionOutcome({
        decisionId: createdDecision.id,
        tenantId,
        decisionType: validated.type as DecisionType,
        riskScore,
        approvalLevel,
        status: 'executed',
        wasApproved: false,
        wasRejected: false,
        wasRolledBack: false,
        executionSuccess: executionResult.success,
        executionError: executionResult.error,
        createdAt: new Date(),
      })
    } else {
      // Create approval queue
      // Determine required approvers based on approval level
      const requiredApprovers = await getRequiredApprovers(tenantId, approvalLevel)

      await prisma.approvalQueue.create({
        data: {
          decisionId: createdDecision.id,
          requiredApprovers,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          priority: riskScore, // Higher risk = higher priority
        },
      })

      // Notify approvers (email, Slack, in-app)
      const { notifyApprovers } = await import('@/lib/notifications/decision-notifications')
      await notifyApprovers({
        decision: createdDecision,
        approvers: requiredApprovers,
        channels: { email: true, slack: true, inApp: true },
      })
    }

    return NextResponse.json({
      success: true,
      decision: createdDecision,
      executionResult:
        approvalLevel === 'AUTO_EXECUTE' || approvalLevel === 'AUDIT_LOG'
          ? await prisma.aIDecision.findUnique({ where: { id: createdDecision.id } })
          : null,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Create AI decision error:', error)
    return NextResponse.json(
      { error: 'Failed to create AI decision', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/decisions
 * Get decisions for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const approvalLevel = searchParams.get('approvalLevel')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    const where: any = { tenantId }
    if (status) where.status = status
    if (approvalLevel) where.approvalLevel = approvalLevel

    const decisions = await prisma.aIDecision.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        approvalQueue: true,
      },
    })

    return NextResponse.json({
      success: true,
      decisions,
      count: decisions.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get AI decisions error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI decisions', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Get required approvers based on approval level
 */
async function getRequiredApprovers(
  tenantId: string,
  approvalLevel: string
): Promise<string[]> {
  // For now, return empty array - will be enhanced in Week 7
  // In production, this would query user roles and permissions
  if (approvalLevel === 'EXECUTIVE_APPROVAL') {
    // Get executives (founders, CFOs)
    const executives = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['OWNER', 'ADMIN', 'CFO'] },
      },
      select: { id: true },
      take: 2,
    })
    return executives.map((u) => u.id)
  } else if (approvalLevel === 'MANAGER_APPROVAL') {
    // Get managers
    const managers = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['MANAGER', 'ADMIN', 'OWNER'] },
      },
      select: { id: true },
      take: 1,
    })
    return managers.map((u) => u.id)
  }

  return []
}
