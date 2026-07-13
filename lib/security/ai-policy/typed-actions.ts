/**
 * Typed action model — models propose; policy engine validates before side effects.
 */

import type { ActionPolicyResult, ProposedAction, ToolCapability } from './types'
import { evaluateToolPolicy } from './tool-inventory'
import { isToolKillSwitchActive } from './circuit-breaker'

const HIGH_IMPACT: ToolCapability[] = ['write', 'send', 'delete', 'execute', 'admin']

export function evaluateProposedAction(params: {
  tenantId: string
  userId: string
  roles?: string[]
  action: ProposedAction
  approvalConfirmed?: boolean
  module?: string
}): ActionPolicyResult {
  const { action } = params

  if (!action.type?.trim()) {
    return { allowed: false, requiresApproval: false, reason: 'Action type is required', code: 'ACTION_INVALID' }
  }

  if (isToolKillSwitchActive() && HIGH_IMPACT.includes(action.capability)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: 'High-impact actions are disabled (AI_TOOL_KILL_SWITCH)',
      code: 'ACTION_KILL_SWITCH',
    }
  }

  const toolCheck = evaluateToolPolicy(
    {
      tenantId: params.tenantId,
      userId: params.userId,
      roles: params.roles,
      toolId: action.type,
    },
    {
      approvalConfirmed: params.approvalConfirmed,
      module: params.module,
    }
  )

  if (!toolCheck.allowed) {
    return {
      allowed: false,
      requiresApproval: Boolean(toolCheck.requiresApproval),
      reason: toolCheck.reason,
      code: toolCheck.code,
    }
  }

  if (HIGH_IMPACT.includes(action.capability) && !params.approvalConfirmed) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: `Approval required for ${action.capability} action ${action.type}`,
      code: 'ACTION_APPROVAL_REQUIRED',
    }
  }

  return { allowed: true, requiresApproval: false }
}
