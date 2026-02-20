/**
 * Risk Policy Manager
 * Manages company-specific risk policies and historical decision tracking
 */

import { prisma } from '@/lib/db/prisma'
import { DecisionType, RiskMatrixEntry, RISK_MATRIX } from './decision-risk'

export interface CompanyRiskPolicy {
  tenantId: string
  decisionType: DecisionType
  customBaseRisk?: number // Override default base risk
  amountThreshold?: number // Custom amount threshold
  autoApproveThreshold?: number // Risk score below which to auto-approve
  requireApprovalThreshold?: number // Risk score above which to require approval
  maxAutoExecuteAmount?: number // Max amount for auto-execution
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DecisionOutcome {
  decisionId: string
  tenantId: string
  decisionType: DecisionType
  riskScore: number
  approvalLevel: string
  status: string
  wasApproved: boolean
  wasRejected: boolean
  wasRolledBack: boolean
  executionSuccess: boolean
  executionError?: string
  actualImpact?: {
    amount?: number
    affectedUsers?: number
    revenueImpact?: number
  }
  createdAt: Date
}

/**
 * Get company-specific risk policy for a decision type
 */
export async function getCompanyRiskPolicy(
  tenantId: string,
  decisionType: DecisionType
): Promise<CompanyRiskPolicy | null> {
  const policy = await prisma.riskPolicy.findUnique({
    where: {
      tenantId_decisionType: {
        tenantId,
        decisionType,
      },
    },
  })

  if (!policy) return null

  return {
    tenantId: policy.tenantId,
    decisionType: policy.decisionType as DecisionType,
    customBaseRisk: policy.customBaseRisk ?? undefined,
    amountThreshold: policy.amountThreshold ? Number(policy.amountThreshold) : undefined,
    autoApproveThreshold: policy.autoApproveThreshold ?? undefined,
    requireApprovalThreshold: policy.requireApprovalThreshold ?? undefined,
    maxAutoExecuteAmount: policy.maxAutoExecuteAmount ? Number(policy.maxAutoExecuteAmount) : undefined,
    enabled: policy.enabled,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  }
}

/**
 * Create or update company risk policy
 */
export async function setCompanyRiskPolicy(
  tenantId: string,
  policy: Partial<CompanyRiskPolicy>
): Promise<CompanyRiskPolicy> {
  const existing = await prisma.riskPolicy.findUnique({
    where: {
      tenantId_decisionType: {
        tenantId,
        decisionType: policy.decisionType!,
      },
    },
  })

  if (existing) {
    const updated = await prisma.riskPolicy.update({
      where: { id: existing.id },
      data: {
        customBaseRisk: policy.customBaseRisk,
        amountThreshold: policy.amountThreshold,
        autoApproveThreshold: policy.autoApproveThreshold,
        requireApprovalThreshold: policy.requireApprovalThreshold,
        maxAutoExecuteAmount: policy.maxAutoExecuteAmount,
        enabled: policy.enabled ?? existing.enabled,
        updatedAt: new Date(),
      },
    })

    return {
      tenantId: updated.tenantId,
      decisionType: updated.decisionType as DecisionType,
      customBaseRisk: updated.customBaseRisk ? Number(updated.customBaseRisk) : undefined,
      amountThreshold: updated.amountThreshold ? Number(updated.amountThreshold) : undefined,
      autoApproveThreshold: updated.autoApproveThreshold ? Number(updated.autoApproveThreshold) : undefined,
      requireApprovalThreshold: updated.requireApprovalThreshold ? Number(updated.requireApprovalThreshold) : undefined,
      maxAutoExecuteAmount: updated.maxAutoExecuteAmount ? Number(updated.maxAutoExecuteAmount) : undefined,
      enabled: updated.enabled,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }
  } else {
    const created = await prisma.riskPolicy.create({
      data: {
        tenantId,
        decisionType: policy.decisionType!,
        customBaseRisk: policy.customBaseRisk,
        amountThreshold: policy.amountThreshold,
        autoApproveThreshold: policy.autoApproveThreshold,
        requireApprovalThreshold: policy.requireApprovalThreshold,
        maxAutoExecuteAmount: policy.maxAutoExecuteAmount,
        enabled: policy.enabled ?? true,
      },
    })

    return {
      tenantId: created.tenantId,
      decisionType: created.decisionType as DecisionType,
      customBaseRisk: created.customBaseRisk ? Number(created.customBaseRisk) : undefined,
      amountThreshold: created.amountThreshold ? Number(created.amountThreshold) : undefined,
      autoApproveThreshold: created.autoApproveThreshold ? Number(created.autoApproveThreshold) : undefined,
      requireApprovalThreshold: created.requireApprovalThreshold ? Number(created.requireApprovalThreshold) : undefined,
      maxAutoExecuteAmount: created.maxAutoExecuteAmount ? Number(created.maxAutoExecuteAmount) : undefined,
      enabled: created.enabled,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    }
  }
}

/**
 * Track decision outcome for historical analysis
 */
export async function trackDecisionOutcome(outcome: DecisionOutcome): Promise<void> {
  try {
    await prisma.decisionOutcome.create({
      data: {
        decisionId: outcome.decisionId,
        tenantId: outcome.tenantId,
        decisionType: outcome.decisionType,
        riskScore: outcome.riskScore,
        approvalLevel: outcome.approvalLevel,
        status: outcome.status,
        wasApproved: outcome.wasApproved,
        wasRejected: outcome.wasRejected,
        wasRolledBack: outcome.wasRolledBack,
        executionSuccess: outcome.executionSuccess,
        executionError: outcome.executionError,
        actualImpact: outcome.actualImpact || {},
      },
    })
  } catch (error) {
    console.error('Failed to track decision outcome:', error)
    // Don't throw - tracking should not break the main flow
  }
}

/**
 * Get historical decision outcomes for analysis
 */
export async function getDecisionOutcomes(
  tenantId: string,
  options: {
    decisionType?: DecisionType
    startDate?: Date
    endDate?: Date
    limit?: number
  } = {}
): Promise<DecisionOutcome[]> {
  const { decisionType, startDate, endDate, limit = 100 } = options

  const where: any = { tenantId }
  if (decisionType) where.decisionType = decisionType
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const outcomes = await prisma.decisionOutcome.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return outcomes.map((o) => ({
    decisionId: o.decisionId,
    tenantId: o.tenantId,
    decisionType: o.decisionType as DecisionType,
    riskScore: o.riskScore,
    approvalLevel: o.approvalLevel,
    status: o.status,
    wasApproved: o.wasApproved,
    wasRejected: o.wasRejected,
    wasRolledBack: o.wasRolledBack,
    executionSuccess: o.executionSuccess,
    executionError: o.executionError ?? undefined,
    actualImpact: (o.actualImpact as any) || undefined,
    createdAt: o.createdAt,
  }))
}

/**
 * Calculate risk calibration metrics
 */
export async function getRiskCalibrationMetrics(
  tenantId: string,
  decisionType?: DecisionType
): Promise<{
  totalDecisions: number
  autoExecuted: number
  approved: number
  rejected: number
  rolledBack: number
  successRate: number
  averageRiskScore: number
  falsePositiveRate: number // Decisions with low risk that were rolled back
  falseNegativeRate: number // Decisions with high risk that succeeded
}> {
  const outcomes = await getDecisionOutcomes(tenantId, { decisionType, limit: 1000 })

  const total = outcomes.length
  const autoExecuted = outcomes.filter((o) => o.approvalLevel === 'AUTO_EXECUTE').length
  const approved = outcomes.filter((o) => o.wasApproved).length
  const rejected = outcomes.filter((o) => o.wasRejected).length
  const rolledBack = outcomes.filter((o) => o.wasRolledBack).length
  const successful = outcomes.filter((o) => o.executionSuccess).length

  const lowRiskRolledBack = outcomes.filter(
    (o) => o.riskScore < 30 && o.wasRolledBack
  ).length
  const highRiskSucceeded = outcomes.filter(
    (o) => o.riskScore >= 60 && o.executionSuccess && !o.wasRolledBack
  ).length

  const averageRiskScore =
    outcomes.length > 0
      ? outcomes.reduce((sum, o) => sum + o.riskScore, 0) / outcomes.length
      : 0

  return {
    totalDecisions: total,
    autoExecuted,
    approved,
    rejected,
    rolledBack,
    successRate: total > 0 ? successful / total : 0,
    averageRiskScore,
    falsePositiveRate: total > 0 ? lowRiskRolledBack / total : 0,
    falseNegativeRate: total > 0 ? highRiskSucceeded / total : 0,
  }
}

/**
 * Get effective risk matrix entry (default + company policy)
 */
export async function getEffectiveRiskMatrix(
  tenantId: string,
  decisionType: DecisionType
): Promise<RiskMatrixEntry> {
  const defaultMatrix = RISK_MATRIX[decisionType]
  const policy = await getCompanyRiskPolicy(tenantId, decisionType)

  if (!policy || !policy.enabled) {
    return defaultMatrix
  }

  return {
    baseRisk: policy.customBaseRisk ?? defaultMatrix.baseRisk,
    affectsRevenue: defaultMatrix.affectsRevenue,
    defaultReversible: defaultMatrix.defaultReversible,
    amountThreshold: policy.amountThreshold ?? defaultMatrix.amountThreshold,
  }
}
