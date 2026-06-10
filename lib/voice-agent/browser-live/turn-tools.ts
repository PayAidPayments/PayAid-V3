/**
 * Browser-live turn tool execution with draft-first safety.
 */

import type { PrismaClient } from '@prisma/client'
import { ToolExecutor, type ToolCall, type ToolResult } from '@/lib/voice-agent/tool-executor'
import { assessBrowserLiveToolCall } from '@/lib/voice-agent/browser-live/tool-safety'
import { isDraftFirstToolName } from '@/lib/voice-agent/runtime/bolna-tool-policy'

type VoiceFunctionTool = {
  name?: string
  description?: string
  enabled?: boolean
  draftFirst?: boolean
  parameters?: {
    type: string
    properties?: Record<string, { type: string; description?: string }>
    required?: string[]
  }
}

const INTENT_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: 'schedule_callback', patterns: [/call (?:me )?back/i, /callback/i, /baad mein call/i] },
  {
    name: 'send_payment_link',
    patterns: [/payment link/i, /pay link/i, /send (?:me )?(?:a )?link/i],
  },
]

function parseFunctionTools(functions: unknown): VoiceFunctionTool[] {
  if (!functions || typeof functions !== 'object') return []
  const root = functions as { tools?: unknown }
  if (!Array.isArray(root.tools)) return []
  return root.tools.filter((t): t is VoiceFunctionTool => !!t && typeof t === 'object')
}

function detectToolIntent(userText: string, configuredNames: Set<string>): string | null {
  const text = userText.trim()
  if (!text) return null
  for (const { name, patterns } of INTENT_PATTERNS) {
    if (!configuredNames.has(name) && name !== 'schedule_callback') continue
    if (patterns.some((p) => p.test(text))) return name
  }
  for (const name of configuredNames) {
    if (isDraftFirstToolName(name) && new RegExp(name.replace(/_/g, ' '), 'i').test(text)) {
      return name
    }
  }
  return null
}

function buildExecutor(
  configured: VoiceFunctionTool[],
  ctx: { tenantId: string; agentId: string; sessionId: string },
): ToolExecutor {
  const executor = new ToolExecutor()
  executor.registerTool({
    name: 'schedule_callback',
    description: 'Log a callback request for human follow-up.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string' },
        notes: { type: 'string' },
        confirmed: { type: 'boolean' },
      },
    },
    execute: async (params) => ({
      status: 'queued',
      tenantId: ctx.tenantId,
      agentId: ctx.agentId,
      sessionId: ctx.sessionId,
      phone: params.phone ?? null,
      notes: params.notes ?? null,
    }),
  })

  for (const entry of configured) {
    const name = (entry.name || '').trim()
    if (!name || entry.enabled === false || executor.getTool(name)) continue
    const draftFirst = entry.draftFirst === true || isDraftFirstToolName(name)
    executor.registerTool({
      name,
      description: entry.description || `Voice tool: ${name}`,
      parameters: entry.parameters ?? { type: 'object', properties: {} },
      execute: async (params) => {
        if (draftFirst && params.confirmed !== true) {
          return {
            draft: true,
            action: name,
            args: params,
            message: 'Draft recorded — confirm before executing.',
          }
        }
        return {
          status: 'accepted',
          action: name,
          tenantId: ctx.tenantId,
          agentId: ctx.agentId,
          sessionId: ctx.sessionId,
          args: params,
        }
      },
    })
  }
  return executor
}

export type BrowserLiveToolTurnOutcome = {
  toolName: string
  draft: boolean
  result: ToolResult
}

export async function processBrowserLiveToolIntent(input: {
  userText: string
  callerPhone?: string | null
  functions: unknown
  tenantId: string
  agentId: string
  sessionId: string
  prisma: PrismaClient
}): Promise<BrowserLiveToolTurnOutcome | null> {
  const configured = parseFunctionTools(input.functions)
  const configuredNames = new Set(
    ['schedule_callback', ...configured.map((t) => (t.name || '').trim()).filter(Boolean)],
  )
  const toolName = detectToolIntent(input.userText, configuredNames)
  if (!toolName) return null

  const args: Record<string, unknown> = {
    phone: input.callerPhone ?? undefined,
    notes: input.userText.slice(0, 500),
  }
  const assessment = assessBrowserLiveToolCall({ name: toolName, args })
  if (assessment.action === 'draft') {
    return {
      toolName,
      draft: true,
      result: {
        tool_call_id: `draft_${Date.now()}`,
        result: assessment.draft,
      },
    }
  }

  const executor = buildExecutor(configured, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
  })
  const toolCall: ToolCall = {
    id: `tool_${Date.now()}`,
    name: toolName,
    arguments: { ...args, confirmed: true },
  }
  const result = await executor.executeToolCall(toolCall)

  const session = await input.prisma.voiceDemoSession.findFirst({
    where: { id: input.sessionId },
    select: { metadataJson: true },
  })
  const prior =
    session?.metadataJson && typeof session.metadataJson === 'object' && !Array.isArray(session.metadataJson)
      ? (session.metadataJson as Record<string, unknown>)
      : {}
  const toolsExecuted = Array.isArray(prior.toolsExecuted) ? [...prior.toolsExecuted] : []
  toolsExecuted.push({
    at: new Date().toISOString(),
    toolName,
    draft: false,
    result: result.result,
    error: result.error,
  })
  await input.prisma.voiceDemoSession.update({
    where: { id: input.sessionId },
    data: { metadataJson: { ...prior, toolsExecuted } },
  })

  return { toolName, draft: false, result }
}
