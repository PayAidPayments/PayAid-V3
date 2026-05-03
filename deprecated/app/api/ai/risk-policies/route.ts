import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import {
  getCompanyRiskPolicy,
  setCompanyRiskPolicy,
  getRiskCalibrationMetrics,
  getDecisionOutcomes,
} from '@/lib/ai/risk-policy-manager'
import { DecisionType } from '@/lib/ai/decision-risk'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const policySchema = z.object({
  decisionType: z.string(),
  customBaseRisk: z.number().int().min(0).max(100).optional(),
  amountThreshold: z.number().optional(),
  autoApproveThreshold: z.number().int().min(0).max(100).optional(),
  requireApprovalThreshold: z.number().int().min(0).max(100).optional(),
  maxAutoExecuteAmount: z.number().optional(),
  enabled: z.boolean().optional(),
})

/**
 * GET /api/ai/risk-policies
 * Get risk policies for tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { searchParams } = new URL(request.url)
    const decisionType = searchParams.get('decisionType') as DecisionType | null

    if (decisionType) {
      const policy = await getCompanyRiskPolicy(tenantId, decisionType)
      return NextResponse.json({ success: true, policy })
    }

    // Get all policies
    const policies = await prisma.riskPolicy.findMany({
      where: { tenantId },
    })

    return NextResponse.json({
      success: true,
      policies: policies.map((p) => ({
        decisionType: p.decisionType,
        customBaseRisk: p.customBaseRisk,
        amountThreshold: p.amountThreshold,
        autoApproveThreshold: p.autoApproveThreshold,
        requireApprovalThreshold: p.requireApprovalThreshold,
        maxAutoExecuteAmount: p.maxAutoExecuteAmount,
        enabled: p.enabled,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get risk policies error:', error)
    return NextResponse.json(
      { error: 'Failed to get risk policies', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/risk-policies
 * Create or update risk policy
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const body = await request.json()
    const validated = policySchema.parse(body)

    const policy = await setCompanyRiskPolicy(tenantId, {
      decisionType: validated.decisionType as DecisionType,
      customBaseRisk: validated.customBaseRisk,
      amountThreshold: validated.amountThreshold,
      autoApproveThreshold: validated.autoApproveThreshold,
      requireApprovalThreshold: validated.requireApprovalThreshold,
      maxAutoExecuteAmount: validated.maxAutoExecuteAmount,
      enabled: validated.enabled,
    })

    return NextResponse.json({ success: true, policy })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Set risk policy error:', error)
    return NextResponse.json(
      { error: 'Failed to set risk policy', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/risk-policies/calibration
 * Get risk calibration metrics
 */
export async function GET_CALIBRATION(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { searchParams } = new URL(request.url)
    const decisionType = searchParams.get('decisionType') as DecisionType | null

    const metrics = await getRiskCalibrationMetrics(tenantId, decisionType || undefined)

    return NextResponse.json({ success: true, metrics })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get calibration metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to get calibration metrics', details: String(error) },
      { status: 500 }
    )
  }
}
