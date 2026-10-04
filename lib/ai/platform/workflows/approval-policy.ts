/**
 * Unified approval policy model — used by custom orchestration, LangChain, and LangGraph nodes.
 */

import type { ApprovalPolicyRule } from '../types'
import type { ProposedAction, ToolCapability } from '@/lib/security/ai-policy'
import { evaluateProposedAction } from '@/lib/security/ai-policy'

export const APPROVAL_POLICIES: Record<string, ApprovalPolicyRule> = {
  'read-only': {
    id: 'read-only',
    capabilities: ['read'],
    requiresHumanApproval: false,
    description: 'Informational reads only',
  },
  'draft-first': {
    id: 'draft-first',
    capabilities: ['read', 'draft'],
    requiresHumanApproval: false,
    description: 'Draft content; no external side effects',
  },
  'guarded-ops': {
    id: 'guarded-ops',
    capabilities: ['read', 'draft', 'write'],
    requiresHumanApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    description: 'Writes require elevated role + approval',
  },
  'external-actions': {
    id: 'external-actions',
    capabilities: ['read', 'draft', 'write', 'send'],
    requiresHumanApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    description: 'Send/publish actions require approval',
  },
  'destructive': {
    id: 'destructive',
    capabilities: ['read', 'draft', 'write', 'send', 'delete', 'execute', 'admin'],
    requiresHumanApproval: true,
    minRoles: ['admin', 'owner'],
    description: 'Destructive or admin actions — owner/admin approval only',
  },
}

export function getApprovalPolicy(policyId: string): ApprovalPolicyRule | undefined {
  return APPROVAL_POLICIES[policyId]
}

export function capabilityAllowedByPolicy(
  policyId: string,
  capability: ToolCapability
): boolean {
  const policy = getApprovalPolicy(policyId)
  if (!policy) return false
  return policy.capabilities.includes(capability)
}

export function evaluateActionAgainstPolicy(params: {
  policyId: string
  tenantId: string
  userId: string
  roles?: string[]
  action: ProposedAction
  approvalConfirmed?: boolean
  module?: string
  shadowMode?: boolean
}): { allowed: boolean; requiresApproval: boolean; shadowBlocked?: boolean; reason?: string; code?: string } {
  const policy = getApprovalPolicy(params.policyId)
  if (!policy) {
    return { allowed: false, requiresApproval: false, reason: 'Unknown approval policy', code: 'POLICY_UNKNOWN' }
  }

  if (!policy.capabilities.includes(params.action.capability)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Capability ${params.action.capability} not allowed by policy ${policy.id}`,
      code: 'POLICY_CAPABILITY_DENIED',
    }
  }

  const actionResult = evaluateProposedAction({
    tenantId: params.tenantId,
    userId: params.userId,
    roles: params.roles,
    action: params.action,
    approvalConfirmed: params.approvalConfirmed,
    module: params.module,
  })

  const shadow = params.shadowMode ?? policy.shadowMode
  if (shadow && ['write', 'send', 'delete', 'execute', 'admin'].includes(params.action.capability)) {
    return {
      allowed: true,
      requiresApproval: true,
      shadowBlocked: true,
      reason: 'Shadow mode: action logged but not executed',
      code: 'POLICY_SHADOW_MODE',
    }
  }

  return actionResult
}
