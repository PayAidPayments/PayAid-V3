/**
 * Bridge voice agent tool names to central AI_TOOL_INVENTORY policy.
 * Voice-specific allowlists remain in tool-gateway; policy checks use inventory.
 */

import {
  evaluateToolPolicy,
  getToolDefinition,
  listClassifiedTools,
  validateToolArgs,
} from './tool-inventory'
import { normalizeToolName } from '@/lib/voice-agent/security/tool-gateway'

/** Voice tool name → inventory id (when names differ) */
const VOICE_TOOL_ALIASES: Record<string, string> = {
  send_payment_link: 'payment_action',
  send_invoice: 'mutate_invoice',
  create_payment: 'payment_action',
  charge_payment: 'payment_action',
  refund_payment: 'payment_action',
  transfer_funds: 'payment_action',
  execute_payment: 'payment_action',
  voice_crm_writeback: 'voice_crm_writeback',
}

export function resolveVoiceToolInventoryId(voiceToolName: string): string {
  const normalized = normalizeToolName(voiceToolName)
  return VOICE_TOOL_ALIASES[normalized] || normalized
}

export type VoiceToolInventoryResult =
  | {
      allowed: true
      inventoryId: string
      auditEvent: string
      owner: string
    }
  | {
      allowed: false
      inventoryId: string
      reason: string
      code?: string
      requiresApproval?: boolean
      auditEvent?: string
      owner?: string
    }

export function evaluateVoiceToolAgainstInventory(input: {
  tenantId: string
  userId: string
  roles?: string[]
  toolName: string
  args?: Record<string, unknown>
  approvalConfirmed?: boolean
  module?: string
}): VoiceToolInventoryResult {
  const inventoryId = resolveVoiceToolInventoryId(input.toolName)
  const def = getToolDefinition(inventoryId)
  if (!def) {
    return {
      allowed: false,
      inventoryId,
      code: 'TOOL_UNKNOWN',
      reason: `Voice tool "${input.toolName}" has no inventory registration`,
      requiresApproval: false,
    }
  }
  const policy = evaluateToolPolicy(
    {
      tenantId: input.tenantId,
      userId: input.userId,
      roles: input.roles,
      toolId: inventoryId,
    },
    {
      approvalConfirmed: input.approvalConfirmed,
      module: input.module || 'voice',
      args: input.args,
    }
  )
  if (!policy.allowed) {
    return {
      allowed: false,
      inventoryId,
      reason: policy.reason || 'Tool denied by central inventory.',
      code: policy.code,
      requiresApproval: policy.requiresApproval === true,
      auditEvent: def.auditEvent,
      owner: 'voice',
    }
  }
  return { allowed: true, inventoryId, auditEvent: def.auditEvent, owner: 'voice' }
}

export function listVoiceRegisteredInventoryTools(): string[] {
  return listClassifiedTools()
    .filter((t) => t.modules.includes('voice'))
    .map((t) => t.id)
}

export function validateVoiceToolArgs(toolName: string, args: unknown) {
  const inventoryId = resolveVoiceToolInventoryId(toolName)
  return validateToolArgs(inventoryId, args)
}
