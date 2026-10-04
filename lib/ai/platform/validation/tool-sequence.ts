/**
 * Validates dangerous tool chains (not just single tool calls).
 */

import type { ToolCapability } from '@/lib/security/ai-policy'
import { getToolDefinition } from '@/lib/security/ai-policy/tool-inventory'

const HIGH_IMPACT: ToolCapability[] = ['write', 'send', 'delete', 'execute', 'admin']

const FORBIDDEN_SEQUENCES: Array<{ tools: string[]; reason: string }> = [
  {
    tools: ['get_churn_risk_customers', 'send_email'],
    reason: 'Bulk outreach after churn scan requires campaign approval workflow',
  },
  {
    tools: ['get_pending_invoices', 'send_email'],
    reason: 'Collections outreach requires collections workflow approval',
  },
]

export interface ToolSequenceStep {
  toolId: string
  at: string
}

export function validateToolSequence(steps: ToolSequenceStep[]): {
  allowed: boolean
  reason?: string
  code?: string
} {
  const ids = steps.map((s) => s.toolId)

  for (const rule of FORBIDDEN_SEQUENCES) {
    const [first, second] = rule.tools
    const firstIdx = ids.indexOf(first)
    const secondIdx = ids.indexOf(second)
    if (firstIdx !== -1 && secondIdx !== -1 && firstIdx < secondIdx) {
      return { allowed: false, reason: rule.reason, code: 'TOOL_SEQUENCE_DENIED' }
    }
  }

  const highImpactCount = ids.filter((id) => {
    const cap = getToolDefinition(id)?.capability
    return cap && HIGH_IMPACT.includes(cap)
  }).length

  if (highImpactCount > 2) {
    return {
      allowed: false,
      reason: 'Too many high-impact tools in single workflow turn',
      code: 'TOOL_SEQUENCE_BURST',
    }
  }

  return { allowed: true }
}
