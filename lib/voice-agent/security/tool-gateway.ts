/**
 * Tool execution gateway — allowlist, schema checks, least-privilege execution.
 * Model may suggest tools; runtime decides whether execution is permitted.
 */
import { isDraftFirstToolName } from '@/lib/voice-agent/runtime/bolna-tool-policy'

export type ToolGatewayDecision =
  | { action: 'execute'; args: Record<string, unknown> }
  | { action: 'draft'; message: string; args: Record<string, unknown> }
  | { action: 'deny'; message: string }

const BLOCKED_TOOL_NAMES = new Set([
  'shell',
  'exec',
  'eval',
  'run_sql',
  'delete_tenant',
  'drop_table',
  'raw_http',
])

const SENSITIVE_ARG_KEYS = new Set(['password', 'secret', 'token', 'apikey', 'api_key', 'authorization'])

export function normalizeToolName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_')
}

export function isToolNameAllowed(name: string, registeredNames: Iterable<string>): boolean {
  const normalized = normalizeToolName(name)
  if (!normalized || BLOCKED_TOOL_NAMES.has(normalized)) return false
  const allowed = new Set([...registeredNames].map(normalizeToolName))
  return allowed.has(normalized)
}

export function stripSensitiveToolArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(args)) {
    if (SENSITIVE_ARG_KEYS.has(key.toLowerCase())) continue
    out[key] = value
  }
  return out
}

export function assessToolGatewayCall(input: {
  name: string
  args: Record<string, unknown>
  registeredToolNames: string[]
  channel?: 'browser_live' | 'telephony'
}): ToolGatewayDecision {
  const name = normalizeToolName(input.name)
  const args = stripSensitiveToolArgs(input.args)

  if (!name) return { action: 'deny', message: 'Tool name is required.' }
  if (BLOCKED_TOOL_NAMES.has(name)) {
    return { action: 'deny', message: `Tool "${name}" is not permitted.` }
  }
  if (!isToolNameAllowed(name, input.registeredToolNames)) {
    return { action: 'deny', message: `Tool "${name}" is not allowlisted for this agent.` }
  }

  if (isDraftFirstToolName(name)) {
    if (args.confirmed === true) return { action: 'execute', args }
    return {
      action: 'draft',
      message: `Draft preview for "${name}". Human approval required (confirmed=true).`,
      args,
    }
  }

  return { action: 'execute', args }
}
