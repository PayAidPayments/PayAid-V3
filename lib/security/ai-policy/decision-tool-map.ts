/**
 * 1:1 map from executeDecision types → inventory tool ids (Phase C4).
 * Approve/execute paths must resolve the typed tool before side effects.
 */

export const DECISION_TYPE_TO_TOOL = {
  send_invoice: 'send_invoice',
  apply_discount: 'apply_discount',
  assign_lead: 'assign_lead',
  create_payment_reminder: 'create_payment_reminder',
  bulk_invoice_payment: 'bulk_invoice_payment',
  change_payment_terms: 'change_payment_terms',
  customer_segment_update: 'customer_segment_update',
  create_task: 'create_task',
  assign_task: 'assign_task',
  update_deal_stage: 'update_deal_stage',
} as const

export type DecisionExecutorType = keyof typeof DECISION_TYPE_TO_TOOL

/** Fallback umbrella tool when type is unknown / future. */
export const DECISION_EXECUTE_FALLBACK_TOOL = 'ai_decision_execute'

export function resolveDecisionToolId(decisionType: string): string {
  const mapped = DECISION_TYPE_TO_TOOL[decisionType as DecisionExecutorType]
  return mapped || DECISION_EXECUTE_FALLBACK_TOOL
}

export function listDecisionExecutorTypes(): DecisionExecutorType[] {
  return Object.keys(DECISION_TYPE_TO_TOOL) as DecisionExecutorType[]
}
