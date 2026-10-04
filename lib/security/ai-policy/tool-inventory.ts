/**
 * Central tool inventory with OWASP-style capability rings.
 * Deny-by-default for high-impact capabilities unless explicitly allowed.
 */

import { z } from 'zod'
import type { ToolCapability, ToolPolicyContext } from './types'
import { isToolKillSwitchActive } from './circuit-breaker'

export type ToolRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ToolApprovalMode = 'none' | 'draft_first' | 'human_required'
export type ToolTenantScope = 'tenant' | 'user' | 'session'

export interface ToolDefinition {
  id: string
  description: string
  capability: ToolCapability
  modules: string[]
  requiresApproval: boolean
  minRoles?: string[]
  /** Explicit risk for runtime / audit */
  riskLevel: ToolRiskLevel
  approvalMode: ToolApprovalMode
  tenantScope: ToolTenantScope
  draftFirst: boolean
  auditEvent: string
  /** Structured args schema — execution must validate before invoke */
  argsSchema: z.ZodTypeAny
}

const ELEVATED_ROLES = new Set(['admin', 'owner', 'super_admin', 'manager'])

const emptyArgs = z.object({}).passthrough()

function def(
  partial: Omit<ToolDefinition, 'argsSchema' | 'riskLevel' | 'approvalMode' | 'tenantScope' | 'draftFirst' | 'auditEvent'> &
    Partial<Pick<ToolDefinition, 'argsSchema' | 'riskLevel' | 'approvalMode' | 'tenantScope' | 'draftFirst' | 'auditEvent'>>
): ToolDefinition {
  const capability = partial.capability
  const riskLevel =
    partial.riskLevel ||
    (capability === 'admin' || capability === 'delete'
      ? 'critical'
      : capability === 'send' || capability === 'execute'
        ? 'high'
        : capability === 'write'
          ? 'medium'
          : 'low')
  const approvalMode =
    partial.approvalMode ||
    (partial.requiresApproval ? 'human_required' : capability === 'write' || capability === 'draft' ? 'draft_first' : 'none')
  return {
    ...partial,
    riskLevel,
    approvalMode,
    tenantScope: partial.tenantScope || 'tenant',
    draftFirst: partial.draftFirst ?? (approvalMode !== 'none' || capability === 'draft'),
    auditEvent: partial.auditEvent || `ai.tool.${partial.id}`,
    argsSchema: partial.argsSchema || emptyArgs,
  }
}

export const AI_TOOL_INVENTORY: Record<string, ToolDefinition> = {
  get_customer_segments: def({
    id: 'get_customer_segments',
    description: 'Read customer segment counts',
    capability: 'read',
    modules: ['crm', 'ai-studio'],
    requiresApproval: false,
  }),
  get_pending_invoices: def({
    id: 'get_pending_invoices',
    description: 'Read pending invoices',
    capability: 'read',
    modules: ['finance', 'crm', 'ai-studio'],
    requiresApproval: false,
  }),
  get_active_deals: def({
    id: 'get_active_deals',
    description: 'Read active deals',
    capability: 'read',
    modules: ['crm', 'ai-studio'],
    requiresApproval: false,
  }),
  get_churn_risk_customers: def({
    id: 'get_churn_risk_customers',
    description: 'Read churn-risk customers',
    capability: 'read',
    modules: ['crm', 'ai-studio'],
    requiresApproval: false,
  }),
  get_revenue_summary: def({
    id: 'get_revenue_summary',
    description: 'Read revenue summary',
    capability: 'read',
    modules: ['finance', 'ai-studio'],
    requiresApproval: false,
  }),
  draft_email: def({
    id: 'draft_email',
    description: 'Draft outbound email (no send)',
    capability: 'draft',
    modules: ['crm', 'marketing', 'ai-studio'],
    requiresApproval: false,
    riskLevel: 'low',
    approvalMode: 'draft_first',
    draftFirst: true,
    argsSchema: z.object({
      to: z.string().email().optional(),
      subject: z.string().min(1),
      body: z.string().min(1),
    }),
  }),
  send_email: def({
    id: 'send_email',
    description: 'Send outbound email',
    capability: 'send',
    modules: ['crm', 'marketing'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'high',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
    }),
  }),
  send_whatsapp_bulk: def({
    id: 'send_whatsapp_bulk',
    description: 'Bulk WhatsApp outbound',
    capability: 'send',
    modules: ['crm', 'marketing'],
    requiresApproval: true,
    minRoles: ['admin', 'owner'],
    riskLevel: 'critical',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      recipients: z.array(z.string()).min(1),
      message: z.string().min(1),
    }),
  }),
  mutate_invoice: def({
    id: 'mutate_invoice',
    description: 'Create or update invoice',
    capability: 'write',
    modules: ['finance'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'high',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      invoiceId: z.string().optional(),
      amount: z.number().optional(),
      status: z.string().optional(),
    }),
  }),
  payment_action: def({
    id: 'payment_action',
    description: 'Record or trigger payment action',
    capability: 'execute',
    modules: ['finance'],
    requiresApproval: true,
    minRoles: ['admin', 'owner'],
    riskLevel: 'critical',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      paymentId: z.string().optional(),
      amount: z.number().positive(),
      currency: z.string().default('INR'),
    }),
  }),
  payroll_change: def({
    id: 'payroll_change',
    description: 'Payroll or statutory change',
    capability: 'write',
    modules: ['hr'],
    requiresApproval: true,
    minRoles: ['admin', 'owner'],
    riskLevel: 'critical',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      employeeId: z.string(),
      changeType: z.string(),
      payload: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
  delete_record: def({
    id: 'delete_record',
    description: 'Delete tenant record',
    capability: 'delete',
    modules: ['crm', 'finance', 'hr'],
    requiresApproval: true,
    minRoles: ['admin', 'owner'],
    riskLevel: 'critical',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      resourceType: z.string(),
      resourceId: z.string(),
    }),
  }),
  role_permission_change: def({
    id: 'role_permission_change',
    description: 'Change roles or permissions',
    capability: 'admin',
    modules: ['settings', 'platform'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'super_admin'],
    riskLevel: 'critical',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      targetUserId: z.string(),
      roles: z.array(z.string()).optional(),
      permissions: z.array(z.string()).optional(),
    }),
  }),
  execute_workflow: def({
    id: 'execute_workflow',
    description: 'Execute automation workflow',
    capability: 'execute',
    modules: ['crm', 'marketing'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'high',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      workflowId: z.string(),
      dryRun: z.boolean().optional(),
    }),
  }),
  admin_config_change: def({
    id: 'admin_config_change',
    description: 'Change tenant/platform configuration',
    capability: 'admin',
    modules: ['settings', 'platform'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'super_admin'],
    riskLevel: 'critical',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      key: z.string(),
      value: z.unknown(),
    }),
  }),
  create_task: def({
    id: 'create_task',
    description: 'Create CRM task from AI action',
    capability: 'write',
    modules: ['crm', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'medium',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      contactId: z.string().optional(),
      title: z.string().optional(),
    }),
  }),
  create_deal: def({
    id: 'create_deal',
    description: 'Create CRM deal from AI action',
    capability: 'write',
    modules: ['crm', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'high',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      contactId: z.string().optional(),
      name: z.string().optional(),
      value: z.number().optional(),
    }),
  }),
  send_invoice: def({
    id: 'send_invoice',
    description: 'Mark invoice as sent (AI decision)',
    capability: 'write',
    modules: ['finance', 'ai-studio', 'crm'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'high',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      invoiceId: z.string().optional(),
      decisionId: z.string().optional(),
    }),
  }),
  apply_discount: def({
    id: 'apply_discount',
    description: 'Apply discount to invoice (AI decision)',
    capability: 'write',
    modules: ['finance', 'ai-studio', 'crm'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'high',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      invoiceId: z.string().optional(),
      discountPercent: z.number().optional(),
      decisionId: z.string().optional(),
    }),
  }),
  assign_lead: def({
    id: 'assign_lead',
    description: 'Assign CRM lead/contact (AI decision)',
    capability: 'write',
    modules: ['crm', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'medium',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      contactId: z.string().optional(),
      assignedToId: z.string().optional(),
      decisionId: z.string().optional(),
    }),
  }),
  create_payment_reminder: def({
    id: 'create_payment_reminder',
    description: 'Create payment reminder task (AI decision)',
    capability: 'write',
    modules: ['finance', 'crm', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'medium',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      invoiceId: z.string().optional(),
      contactId: z.string().optional(),
      decisionId: z.string().optional(),
    }),
  }),
  bulk_invoice_payment: def({
    id: 'bulk_invoice_payment',
    description: 'Mark multiple invoices paid (AI decision)',
    capability: 'execute',
    modules: ['finance', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner'],
    riskLevel: 'critical',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      invoiceIds: z.array(z.string()).optional(),
      decisionId: z.string().optional(),
    }),
  }),
  change_payment_terms: def({
    id: 'change_payment_terms',
    description: 'Change customer payment terms (AI decision)',
    capability: 'write',
    modules: ['finance', 'crm', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'high',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      contactId: z.string().optional(),
      terms: z.string().optional(),
      decisionId: z.string().optional(),
    }),
  }),
  customer_segment_update: def({
    id: 'customer_segment_update',
    description: 'Update customer segment tags (AI decision)',
    capability: 'write',
    modules: ['crm', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'medium',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      contactId: z.string().optional(),
      tags: z.array(z.string()).optional(),
      decisionId: z.string().optional(),
    }),
  }),
  assign_task: def({
    id: 'assign_task',
    description: 'Assign CRM task (AI decision)',
    capability: 'write',
    modules: ['crm', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'medium',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      taskId: z.string().optional(),
      assignedToId: z.string().optional(),
      decisionId: z.string().optional(),
    }),
  }),
  update_deal_stage: def({
    id: 'update_deal_stage',
    description: 'Update CRM deal stage (AI decision)',
    capability: 'write',
    modules: ['crm', 'ai-studio'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'high',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      dealId: z.string().optional(),
      stage: z.string().optional(),
      decisionId: z.string().optional(),
    }),
  }),
  ai_decision_execute: def({
    id: 'ai_decision_execute',
    description: 'Fallback execute for unknown AI decision types',
    capability: 'execute',
    modules: ['ai-studio', 'crm', 'finance'],
    requiresApproval: true,
    minRoles: ['admin', 'owner', 'manager'],
    riskLevel: 'critical',
    approvalMode: 'human_required',
    draftFirst: true,
    argsSchema: z.object({
      decisionId: z.string(),
      decisionType: z.string().optional(),
      action: z.enum(['approve', 'reject']).optional(),
    }),
  }),
  voice_crm_writeback: def({
    id: 'voice_crm_writeback',
    description: 'Write voice call outcomes to CRM',
    capability: 'write',
    modules: ['crm', 'voice'],
    requiresApproval: false,
    riskLevel: 'medium',
    approvalMode: 'draft_first',
    draftFirst: true,
    argsSchema: z.object({
      contactId: z.string().optional(),
      notes: z.string().optional(),
      disposition: z.string().optional(),
    }),
  }),
}

const HIGH_IMPACT: ToolCapability[] = ['write', 'send', 'delete', 'execute', 'admin']

export function getToolDefinition(toolId: string): ToolDefinition | undefined {
  return AI_TOOL_INVENTORY[toolId]
}

export function listClassifiedTools(): ToolDefinition[] {
  return Object.values(AI_TOOL_INVENTORY)
}

export function validateToolArgs(
  toolId: string,
  args: unknown
): { ok: boolean; data?: Record<string, unknown>; error?: string; code?: string } {
  const tool = getToolDefinition(toolId)
  if (!tool) {
    return { ok: false, error: `Unknown tool: ${toolId}`, code: 'TOOL_UNKNOWN' }
  }
  const parsed = tool.argsSchema.safeParse(args ?? {})
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors.map((e) => e.message).join('; '),
      code: 'TOOL_ARGS_INVALID',
    }
  }
  return { ok: true, data: parsed.data as Record<string, unknown> }
}

export function evaluateToolPolicy(
  ctx: ToolPolicyContext,
  options?: { approvalConfirmed?: boolean; module?: string; args?: unknown }
): { allowed: boolean; reason?: string; code?: string; requiresApproval?: boolean } {
  const tool = getToolDefinition(ctx.toolId)
  if (!tool) {
    return { allowed: false, reason: `Unknown tool: ${ctx.toolId}`, code: 'TOOL_UNKNOWN' }
  }

  if (!ctx.tenantId?.trim()) {
    return { allowed: false, reason: 'Tenant scope required', code: 'TOOL_TENANT_REQUIRED' }
  }

  if (options?.args !== undefined) {
    const argsCheck = validateToolArgs(ctx.toolId, options.args)
    if (!argsCheck.ok) {
      return { allowed: false, reason: argsCheck.error, code: argsCheck.code }
    }
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
