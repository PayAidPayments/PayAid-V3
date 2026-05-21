/**
 * Bolna tenant-bridge tool execution — delegates to ToolExecutor with tenant context,
 * entitlement checks, audit logging, and draft-first guards for sensitive actions.
 */

import { prisma } from '@payaid/db'
import { ToolExecutor, type Tool, type ToolCall, type ToolResult } from '@/lib/voice-agent/tool-executor'
import type { BolnaCallJwtClaims } from './types'
import { isDraftFirstToolName } from './bolna-tool-policy'

export { isDraftFirstToolName } from './bolna-tool-policy'

const AI_STUDIO_MODULE = 'ai-studio'
const BRIDGE_ACTOR = 'bolna-bridge'

export interface BolnaToolExecuteInput {
  claims: BolnaCallJwtClaims
  action: string
  args: Record<string, unknown>
}

export interface BolnaToolExecuteOutput {
  result: ToolResult
  draft?: boolean
}

type VoiceFunctionTool = {
  name?: string
  description?: string
  parameters?: Tool['parameters']
  enabled?: boolean
  draftFirst?: boolean
}

function parseFunctionTools(functions: unknown): VoiceFunctionTool[] {
  if (!functions || typeof functions !== 'object') return []
  const root = functions as { tools?: unknown }
  if (!Array.isArray(root.tools)) return []
  return root.tools.filter((t): t is VoiceFunctionTool => !!t && typeof t === 'object')
}

async function assertTenantVoiceEntitlement(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { licensedModules: true, subscriptionTier: true, status: true },
  })
  if (!tenant || tenant.status === 'deleted') {
    throw new Error('Tenant not found or inactive')
  }
  const modules = tenant.licensedModules ?? []
  const tier = tenant.subscriptionTier || 'free'
  const freeUnrestricted = tier === 'free' && modules.length === 0
  if (freeUnrestricted || modules.includes(AI_STUDIO_MODULE)) return
  throw new Error(`Module '${AI_STUDIO_MODULE}' is not licensed for this tenant`)
}

function registerBuiltInTools(executor: ToolExecutor, ctx: BolnaCallJwtClaims): void {
  executor.registerTool({
    name: 'ping',
    description: 'Bridge connectivity probe — returns the arguments echoed back.',
    parameters: {
      type: 'object',
      properties: { message: { type: 'string' } },
    },
    execute: async (params) => ({
      echoed: params.message ?? null,
      callSid: ctx.callSid,
      at: new Date().toISOString(),
    }),
  })

  executor.registerTool({
    name: 'schedule_callback',
    description: 'Log a callback request for a human follow-up (no outbound dial).',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Callback phone number' },
        preferredTime: { type: 'string', description: 'Preferred day/time window' },
        notes: { type: 'string', description: 'Optional notes' },
      },
      required: ['phone'],
    },
    execute: async (params) => ({
      status: 'queued',
      tenantId: ctx.tenantId,
      agentId: ctx.agentId,
      callSid: ctx.callSid,
      phone: params.phone,
      preferredTime: params.preferredTime ?? null,
      notes: params.notes ?? null,
    }),
  })
}

function registerConfiguredTools(
  executor: ToolExecutor,
  configured: VoiceFunctionTool[],
  ctx: BolnaCallJwtClaims,
): void {
  for (const entry of configured) {
    const name = (entry.name || '').trim()
    if (!name || entry.enabled === false) continue
    if (executor.getTool(name)) continue

    const draftFirst = entry.draftFirst === true || isDraftFirstToolName(name)

    executor.registerTool({
      name,
      description: entry.description || `Tenant-configured voice tool: ${name}`,
      parameters: entry.parameters ?? {
        type: 'object',
        properties: {},
      },
      execute: async (params) => {
        if (draftFirst && params.confirmed !== true) {
          return {
            draft: true,
            action: name,
            args: params,
            message:
              'Draft recorded. Sensitive actions require explicit confirmation before execution.',
          }
        }
        return {
          status: 'accepted',
          action: name,
          tenantId: ctx.tenantId,
          agentId: ctx.agentId,
          callSid: ctx.callSid,
          args: params,
        }
      },
    })
  }
}

async function appendCallToolAudit(
  ctx: BolnaCallJwtClaims,
  action: string,
  payload: { ok: boolean; draft?: boolean; error?: string },
): Promise<void> {
  const entry = {
    at: new Date().toISOString(),
    action,
    ...payload,
  }

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        entityType: 'voice_agent_tool',
        entityId: ctx.callSid,
        changedBy: BRIDGE_ACTOR,
        changeSummary: `Bolna tool ${action} (${payload.draft ? 'draft' : payload.ok ? 'ok' : 'error'})`,
        afterSnapshot: entry,
      },
    })
  } catch (error) {
    console.warn('[bolna-tool-bridge] AuditLog write failed:', error)
  }

  try {
    const call = await prisma.voiceAgentCall.findFirst({
      where: { callSid: ctx.callSid, tenantId: ctx.tenantId },
      select: { id: true, metadata: { select: { id: true, actionsExecuted: true } } },
    })
    if (!call) return

    const prior = Array.isArray(call.metadata?.actionsExecuted)
      ? (call.metadata!.actionsExecuted as unknown[])
      : []
    const next = [...prior, entry].slice(-100)

    if (call.metadata) {
      await prisma.voiceAgentCallMetadata.update({
        where: { id: call.metadata.id },
        data: { actionsExecuted: next as any },
      })
    } else {
      await prisma.voiceAgentCallMetadata.create({
        data: { callId: call.id, actionsExecuted: next as any },
      })
    }
  } catch (error) {
    console.warn('[bolna-tool-bridge] call metadata tool audit failed:', error)
  }
}

const executorCache = new Map<string, ToolExecutor>()

function getExecutorForAgent(agentId: string, functions: unknown, claims: BolnaCallJwtClaims): ToolExecutor {
  const cacheKey = agentId
  const existing = executorCache.get(cacheKey)
  if (existing) return existing

  const executor = new ToolExecutor()
  registerBuiltInTools(executor, claims)
  registerConfiguredTools(executor, parseFunctionTools(functions), claims)
  executorCache.set(cacheKey, executor)
  return executor
}

/**
 * Execute a Bolna tool call for an authenticated per-call JWT.
 */
export async function executeBolnaBridgeTool(input: BolnaToolExecuteInput): Promise<BolnaToolExecuteOutput> {
  const action = input.action.trim()
  if (!action) {
    return {
      result: { tool_call_id: 'invalid', result: null, error: 'action is required' },
    }
  }

  const { claims, args } = input

  await assertTenantVoiceEntitlement(claims.tenantId)

  const agent = await prisma.voiceAgent.findFirst({
    where: { id: claims.agentId, tenantId: claims.tenantId, status: { not: 'deleted' } },
    select: { id: true, functions: true },
  })
  if (!agent) {
    const result: ToolResult = {
      tool_call_id: `${claims.callSid}:missing-agent`,
      result: null,
      error: 'Voice agent not found for this call',
    }
    return { result }
  }

  if (isDraftFirstToolName(action) && args.confirmed !== true) {
    const draftResult = {
      draft: true,
      action,
      args,
      message: 'Draft recorded. Set confirmed=true after caller approval to execute.',
    }
    await appendCallToolAudit(claims, action, { ok: true, draft: true })
    return {
      draft: true,
      result: {
        tool_call_id: `${claims.callSid}:${Date.now()}`,
        result: draftResult,
      },
    }
  }

  const executor = getExecutorForAgent(agent.id, agent.functions, claims)
  const toolCall: ToolCall = {
    id: `${claims.callSid}:${Date.now()}`,
    name: action,
    arguments: args,
  }

  const result = await executor.executeToolCall(toolCall)
  const draft =
    result.result &&
    typeof result.result === 'object' &&
    (result.result as { draft?: boolean }).draft === true

  await appendCallToolAudit(claims, action, {
    ok: !result.error,
    draft,
    error: result.error,
  })

  return { result, draft: draft || undefined }
}
