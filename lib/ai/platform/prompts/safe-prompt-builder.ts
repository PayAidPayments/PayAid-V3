/**
 * SafePromptBuilder — D1 prompt governance ingress.
 *
 * Explicit role layers:
 *   system (trusted) → developer (trusted) → tenant (allowlisted) → user + untrusted
 *
 * Enforces: registry lookup, allowlisted variables, untrusted injection scan,
 * optional AI_PROMPT_STRICT=1 refusal for unknown templates / freeform.
 */

import { scanForPromptInjection } from '@/lib/security/ai-policy/prompt-injection-scanner'
import { recordAiPolicyAudit } from '@/lib/security/ai-policy/ai-audit'
import type { AiSurface } from '@/lib/security/ai-policy'
import {
  buildPromptFromTemplate,
  getPromptTemplate,
  type BuiltPrompt,
} from './registry'
import { agentTemplateId, ensureAgentPromptTemplatesSeeded } from './agent-prompt-seed'

export type PromptPolicyDecision = 'allowed' | 'blocked'

export interface SafePromptBuildInput {
  templateId: string
  templateVersion?: string
  /** Already gateway-sanitized user message when available */
  userMessage: string
  /** Allowlisted trusted variables only (system/developer/tenant layers) */
  variables?: Record<string, string>
  /** Untrusted: business context, RAG, project notes, visitor text */
  untrustedContext?: Record<string, string>
  /** Extra developer policy (platform-owned, not user-controlled) */
  developerExtras?: string
  tenantId?: string
  userId?: string
  surface?: AiSurface
  route?: string
  sessionId?: string
  interactionId?: string
  /** Override env AI_PROMPT_STRICT=1 */
  strict?: boolean
  /** Persist policy audit when tenantId+userId present (default true) */
  audit?: boolean
}

export interface SafePromptBuildResult extends BuiltPrompt {
  messages: Array<{ role: 'system' | 'user'; content: string }>
  policyDecision: PromptPolicyDecision
  policyCode?: string
  policyReason?: string
  injectionRiskScore: number
  injectionFlags: string[]
  layers: {
    system: string
    developer?: string
    tenantKeys: string[]
    user: string
    untrustedKeys: string[]
  }
}

export class SafePromptBuilderError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'SafePromptBuilderError'
    this.code = code
  }
}

/** Convention: env value `"1"` enables (scripts/strict-flag). */
function isPromptStrict(override?: boolean): boolean {
  if (typeof override === 'boolean') return override
  return process.env.AI_PROMPT_STRICT === '1'
}

function scanUntrusted(untrusted?: Record<string, string>): {
  riskScore: number
  flags: string[]
  sanitized: Record<string, string>
  blocked: boolean
} {
  const sanitized: Record<string, string> = {}
  const flags = new Set<string>()
  let riskScore = 0
  let blocked = false

  for (const [key, value] of Object.entries(untrusted || {})) {
    if (!value?.trim()) continue
    const scan = scanForPromptInjection(value)
    scan.flags.forEach((f) => flags.add(f))
    riskScore = Math.max(riskScore, scan.riskScore)
    if (scan.blocked) blocked = true
    sanitized[key] = scan.sanitizedText
  }

  return { riskScore, flags: [...flags], sanitized, blocked }
}

/**
 * Build a structured, auditable prompt from a registry template.
 */
export function buildSafePrompt(input: SafePromptBuildInput): SafePromptBuildResult {
  ensureAgentPromptTemplatesSeeded()

  const strict = isPromptStrict(input.strict)
  const template = getPromptTemplate(input.templateId, input.templateVersion)

  if (!template) {
    const code = 'PROMPT_TEMPLATE_UNKNOWN'
    const reason = `Unknown prompt template: ${input.templateId}`
    if (strict) {
      void logPromptPolicyDecision({
        ...input,
        templateId: input.templateId,
        templateVersion: input.templateVersion || 'unknown',
        policyDecision: 'blocked',
        policyCode: code,
        policyReason: reason,
        injectionRiskScore: 0,
        injectionFlags: [],
      })
      throw new SafePromptBuilderError(code, reason)
    }
    throw new SafePromptBuilderError(code, reason)
  }

  const untrustedScan = scanUntrusted(input.untrustedContext)
  if (untrustedScan.blocked) {
    const code = 'PROMPT_UNTRUSTED_BLOCKED'
    const reason = 'Untrusted context failed prompt-injection scan'
    void logPromptPolicyDecision({
      ...input,
      templateId: template.id,
      templateVersion: template.version,
      policyDecision: 'blocked',
      policyCode: code,
      policyReason: reason,
      injectionRiskScore: untrustedScan.riskScore,
      injectionFlags: untrustedScan.flags,
    })
    throw new SafePromptBuilderError(code, reason)
  }

  const built = buildPromptFromTemplate({
    templateId: template.id,
    version: template.version,
    userMessage: input.userMessage,
    trustedSlots: input.variables,
    untrustedSlots: untrustedScan.sanitized,
    developerExtras: input.developerExtras,
  })

  if (built.rejectedVariables?.length) {
    const code = 'PROMPT_VARIABLE_NOT_ALLOWLISTED'
    const reason = `Rejected variables: ${built.rejectedVariables.join(', ')}`
    if (strict) {
      void logPromptPolicyDecision({
        ...input,
        templateId: template.id,
        templateVersion: template.version,
        policyDecision: 'blocked',
        policyCode: code,
        policyReason: reason,
        injectionRiskScore: untrustedScan.riskScore,
        injectionFlags: untrustedScan.flags,
      })
      throw new SafePromptBuilderError(code, reason)
    }
    // Soft mode: continue but flag in audit
  }

  const result: SafePromptBuildResult = {
    ...built,
    messages: [
      { role: 'system', content: built.system },
      { role: 'user', content: built.user },
    ],
    policyDecision: 'allowed',
    policyCode: built.rejectedVariables?.length ? 'PROMPT_VARIABLE_REJECTED_SOFT' : 'PROMPT_OK',
    policyReason: built.rejectedVariables?.length
      ? `Soft-rejected variables: ${built.rejectedVariables.join(', ')}`
      : 'Prompt built from registry template',
    injectionRiskScore: untrustedScan.riskScore,
    injectionFlags: untrustedScan.flags,
    layers: {
      system: template.trustedSystem.slice(0, 200),
      developer: template.developerPolicy?.slice(0, 200),
      tenantKeys: Object.keys(input.variables || {}).filter((k) =>
        template.allowlistedVariables.includes(k)
      ),
      user: input.userMessage.slice(0, 200),
      untrustedKeys: Object.keys(untrustedScan.sanitized),
    },
  }

  void logPromptPolicyDecision({
    ...input,
    templateId: result.templateId,
    templateVersion: result.templateVersion,
    policyDecision: result.policyDecision,
    policyCode: result.policyCode,
    policyReason: result.policyReason,
    injectionRiskScore: result.injectionRiskScore,
    injectionFlags: result.injectionFlags,
  })

  return result
}

/** Resolve template id for a Co-Founder / specialist agent. */
export function resolveAgentPromptTemplateId(agentId: string): string {
  ensureAgentPromptTemplatesSeeded()
  return agentTemplateId(agentId)
}

export async function logPromptPolicyDecision(event: {
  templateId: string
  templateVersion: string
  tenantId?: string
  userId?: string
  surface?: AiSurface
  route?: string
  sessionId?: string
  interactionId?: string
  policyDecision: PromptPolicyDecision
  policyCode?: string
  policyReason?: string
  injectionRiskScore?: number
  injectionFlags?: string[]
  userMessage?: string
  audit?: boolean
}): Promise<void> {
  const payload = {
    event: 'ai_prompt_policy',
    templateId: event.templateId,
    templateVersion: event.templateVersion,
    policyDecision: event.policyDecision,
    policyCode: event.policyCode,
    policyReason: event.policyReason,
    injectionRiskScore: event.injectionRiskScore,
    injectionFlags: event.injectionFlags,
    surface: event.surface,
    route: event.route,
    interactionId: event.interactionId,
    tenantId: event.tenantId,
  }

  // Structured console signal for ops / log drains
  console.info('[ai-prompt-policy]', JSON.stringify(payload))

  if (event.audit === false) return
  if (!event.tenantId || !event.userId || !event.surface || !event.route) return

  await recordAiPolicyAudit({
    surface: event.surface,
    route: event.route,
    tenantId: event.tenantId,
    userId: event.userId,
    sessionId: event.sessionId || event.interactionId,
    promptPreview: event.userMessage || `[template:${event.templateId}@${event.templateVersion}]`,
    policyDecision: event.policyDecision,
    policyCode: event.policyCode,
    policyReason: event.policyReason,
    injectionRiskScore: event.injectionRiskScore,
    injectionFlags: event.injectionFlags,
    promptTemplateId: event.templateId,
    promptTemplateVersion: event.templateVersion,
  })
}
