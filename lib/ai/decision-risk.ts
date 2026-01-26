/**
 * Decision Risk Calculation & Approval Level Logic
 * Determines risk score and approval requirements for AI decisions
 */

export type DecisionType =
  | 'send_invoice'
  | 'apply_discount'
  | 'assign_lead'
  | 'create_payment_reminder'
  | 'bulk_invoice_payment'
  | 'change_payment_terms'
  | 'customer_segment_update'
  | 'report_generation'
  | 'update_invoice_status'
  | 'create_task'
  | 'assign_task'
  | 'update_deal_stage'

export type ApprovalLevel =
  | 'AUTO_EXECUTE'
  | 'AUDIT_LOG'
  | 'MANAGER_APPROVAL'
  | 'EXECUTIVE_APPROVAL'

export interface Decision {
  type: DecisionType
  amount?: number
  affectedUsers?: number
  affectsRevenue?: boolean
  reversible?: boolean
  metadata?: Record<string, any>
}

export interface RiskMatrixEntry {
  baseRisk: number // 0-100
  affectsRevenue: boolean
  defaultReversible: boolean
  amountThreshold?: number // Amount that increases risk
}

// Risk matrix for different decision types
export const RISK_MATRIX: Record<DecisionType, RiskMatrixEntry> = {
  send_invoice: {
    baseRisk: 10,
    affectsRevenue: true,
    defaultReversible: true,
    amountThreshold: 100000, // ₹1L
  },
  apply_discount: {
    baseRisk: 45,
    affectsRevenue: true,
    defaultReversible: true,
    amountThreshold: 50000, // ₹50K
  },
  assign_lead: {
    baseRisk: 5,
    affectsRevenue: false,
    defaultReversible: true,
  },
  create_payment_reminder: {
    baseRisk: 2,
    affectsRevenue: false,
    defaultReversible: true,
  },
  bulk_invoice_payment: {
    baseRisk: 70,
    affectsRevenue: true,
    defaultReversible: false,
    amountThreshold: 50000, // ₹50K
  },
  change_payment_terms: {
    baseRisk: 60,
    affectsRevenue: true,
    defaultReversible: true,
    amountThreshold: 100000, // ₹1L
  },
  customer_segment_update: {
    baseRisk: 30,
    affectsRevenue: true,
    defaultReversible: true,
  },
  report_generation: {
    baseRisk: 0,
    affectsRevenue: false,
    defaultReversible: true,
  },
  update_invoice_status: {
    baseRisk: 15,
    affectsRevenue: true,
    defaultReversible: true,
  },
  create_task: {
    baseRisk: 5,
    affectsRevenue: false,
    defaultReversible: true,
  },
  assign_task: {
    baseRisk: 8,
    affectsRevenue: false,
    defaultReversible: true,
  },
  update_deal_stage: {
    baseRisk: 25,
    affectsRevenue: true,
    defaultReversible: true,
  },
}

/**
 * Calculate risk score for a decision (0-100)
 * Now supports company-specific policies
 */
export async function calculateRiskScore(
  decision: Decision,
  tenantId?: string
): Promise<number> {
  // Get effective risk matrix (default + company policy)
  let matrixEntry = RISK_MATRIX[decision.type]
  if (!matrixEntry) {
    // Unknown decision type - default to medium risk
    return 50
  }

  // Apply company-specific policy if tenantId provided
  if (tenantId) {
    const { getEffectiveRiskMatrix } = await import('./risk-policy-manager')
    try {
      matrixEntry = await getEffectiveRiskMatrix(tenantId, decision.type)
    } catch (error) {
      console.warn('Failed to get company risk policy, using default:', error)
    }
  }

  let risk = matrixEntry.baseRisk

  // Amount-based risk adjustment
  if (decision.amount && matrixEntry.amountThreshold) {
    if (decision.amount > matrixEntry.amountThreshold * 10) {
      // Very large amount (>10x threshold)
      risk += 30
    } else if (decision.amount > matrixEntry.amountThreshold * 5) {
      // Large amount (>5x threshold)
      risk += 20
    } else if (decision.amount > matrixEntry.amountThreshold) {
      // Above threshold
      risk += 10
    }
  }

  // Affected users risk adjustment
  if (decision.affectedUsers) {
    if (decision.affectedUsers > 1000) {
      risk += 20
    } else if (decision.affectedUsers > 100) {
      risk += 15
    } else if (decision.affectedUsers > 50) {
      risk += 10
    } else if (decision.affectedUsers > 10) {
      risk += 5
    }
  }

  // Reversibility risk adjustment
  const isReversible = decision.reversible ?? matrixEntry.defaultReversible
  if (!isReversible) {
    risk += 25
  }

  // Revenue impact risk adjustment
  const affectsRevenue = decision.affectsRevenue ?? matrixEntry.affectsRevenue
  if (affectsRevenue && decision.amount && decision.amount > 500000) {
    // Large revenue impact (>₹5L)
    risk += 15
  }

  // Cap at 100
  return Math.min(100, Math.max(0, risk))
}

/**
 * Get approval level based on risk score
 */
export function getApprovalRequirement(riskScore: number): ApprovalLevel {
  if (riskScore >= 70) {
    return 'EXECUTIVE_APPROVAL' // Founder/CFO
  } else if (riskScore >= 40) {
    return 'MANAGER_APPROVAL' // Department head
  } else if (riskScore >= 10) {
    return 'AUDIT_LOG' // Auto-execute with logging
  }
  return 'AUTO_EXECUTE' // Silent execution
}

/**
 * Get risk category label
 */
export function getRiskCategory(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore >= 70) return 'critical'
  if (riskScore >= 40) return 'high'
  if (riskScore >= 10) return 'medium'
  return 'low'
}

/**
 * Get risk category color (for UI)
 */
export function getRiskColor(riskScore: number): string {
  if (riskScore >= 70) return 'red'
  if (riskScore >= 40) return 'orange'
  if (riskScore >= 10) return 'yellow'
  return 'green'
}

/**
 * Check if decision can be auto-executed
 */
export function canAutoExecute(riskScore: number): boolean {
  return riskScore < 30
}

/**
 * Get decision metadata from risk matrix
 */
export function getDecisionMetadata(type: DecisionType): RiskMatrixEntry | null {
  return RISK_MATRIX[type] || null
}
