/**
 * Central tool inventory with OWASP-style capability rings.
 * Deny-by-default for high-impact capabilities unless explicitly allowed.
 */

import type { ToolCapability, ToolPolicyContext } from './types'
import { isToolKillSwitchActive } from './circuit-breaker'

export interface ToolDefinition {
  id: string
  description: string
  capability: ToolCapability
  modules: string[]
  requiresApproval: boolean
  minRoles?: string[]
}

const ELEVATED_ROLES = new Set(['admin', 'owner', 'super_admin', 'manager'])

export const AI_TOOL_INVENTORY: Record<string, ToolDefinition> = {
  get_customer_segments: {
    id: 'get_customer_segments',
    description: 'Read customer segment counts',
    capability: 'read',
    modules: ['crm', 'ai-studio'],
    requiresApproval: false,
  },
  get_pending_invoices: {
    id: 'get_pending_invoices',
    description: 'Read pending invoices',
    capability: 'read',
    modules: ['finance', 'crm', 'ai-studio'],
    requiresApproval: false,
  },
  get_active_deals: {
    id: 'get_active_deals',
    description: 'Read active deals',
    capability: 'read',
    modules: ['crm', 'ai-studio'],
    requiresApproval: false,
  },
  get_churn_risk_customers: {
    id: 'get_churn_risk_customers',
    description: 'Read churn-risk customers',
    capability: 'read',
    modules: ['crm', 'ai-studio'],
    requiresApproval: false,
  },
  get_revenue_summary: {
    id: 'get_revenue_summary',
    description: 'Read revenue summary',
    capability: 'read',
    modules: ['finance', 'ai-studio'],
    requiresApproval: false,
  },
  send_email: {
    id: 'send_email',
    description: 'Send outbound email',
    capability: 'send',
    modules: ['crm', 'marketing'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
  },
  delete_record: {
    id: 'delete_record',
    description: 'Delete tenant record',
    capability: 'delete',
    modules: ['crm', 'finance', 'hr'],
    requiresApproval: true,
    minRoles: ['admin', 'owner'],
  },
  execute_workflow: {
    id: 'execute_workflow',
    description: 'Execute automation workflow',
    capability: 'execute',
    modules: ['crm', 'marketing'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
  },
  admin_config_change: {
    id: 'admin_config_change',
    description: 'Change tenant/platform configuration',
    capability: 'admin',
    modules: ['settings', 'platform'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'super_admin'],
  },
}

const HIGH_IMPACT: ToolCapability[] = ['write', 'send', 'delete', 'execute', 'admin']

export function getToolDefinition(toolId: string): ToolDefinition | undefined {
  return AI_TOOL_INVENTORY[toolId]
}

export function listClassifiedTools(): ToolDefinition[] {
  return Object.values(AI_TOOL_INVENTORY)
}

export function evaluateToolPolicy(
  ctx: ToolPolicyContext,
  options?: { approvalConfirmed?: boolean; module?: string }
): { allowed: boolean; reason?: string; code?: string; requiresApproval?: boolean } {
  const tool = getToolDefinition(ctx.toolId)
  if (!tool) {
    return { allowed: false, reason: `Unknown tool: ${ctx.toolId}`, code: 'TOOL_UNKNOWN' }
  }

  if (isToolKillSwitchActive() && HIGH_IMPACT.includes(tool.capability)) {
    return {
      allowed: false,
      reason: 'High-impact tools are temporarily disabled (AI_TOOL_KILL_SWITCH)',
      code: 'TOOL_KILL_SWITCH',
    }
  }

  const moduleName = options?.module || 'ai-studio'
  if (!tool.modules.includes(moduleName) && !tool.modules.includes('ai-studio')) {
    return {
      allowed: false,
      reason: `Tool ${tool.id} is not allowed in module ${moduleName}`,
      code: 'TOOL_MODULE_DENIED',
    }
  }

  if (tool.minRoles?.length) {
    const roles = (ctx.roles || []).map((r) => r.toLowerCase())
    const ok = tool.minRoles.some((r) => roles.includes(r.toLowerCase()))
    if (!ok && !roles.some((r) => ELEVATED_ROLES.has(r))) {
      return {
        allowed: false,
        reason: `Role not permitted for tool ${tool.id}`,
        code: 'TOOL_ROLE_DENIED',
      }
    }
  }

  if (tool.requiresApproval && !options?.approvalConfirmed) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: `Human approval required for ${tool.capability} tool ${tool.id}`,
      code: 'TOOL_APPROVAL_REQUIRED',
    }
  }

  return { allowed: true }
}
