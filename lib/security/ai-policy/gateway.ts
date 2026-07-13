/**
 * Central AI policy gateway — enforce before model input and before tool execution.
 */

import { scanForPromptInjection, scanRetrievedChunks } from './prompt-injection-scanner'
import { checkAiRateLimit, isToolKillSwitchActive } from './circuit-breaker'
import { recordAiPolicyAudit } from './ai-audit'
import type { AiPolicyDecision, AiPolicyInput } from './types'

export const AI_POLICY_VERSION = '2026-06-12-p0'

export async function enforceAiPolicyGateway(input: AiPolicyInput): Promise<AiPolicyDecision> {
  const killSwitch = isToolKillSwitchActive()
  const rate = checkAiRateLimit(input.tenantId, input.surface)

  if (!rate.allowed) {
    const decision: AiPolicyDecision = {
      allowed: false,
      blockCode: 'AI_RATE_LIMITED',
      blockReason: `AI rate limit exceeded for ${input.surface}`,
      sanitizedPrompt: input.prompt,
      redactions: [],
      injectionRiskScore: 0,
      injectionFlags: [],
      rateLimited: true,
      toolKillSwitchActive: killSwitch,
      policyVersion: AI_POLICY_VERSION,
    }

    await recordAiPolicyAudit({
      surface: input.surface,
      route: input.route,
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      promptPreview: input.prompt,
      policyDecision: 'blocked',
      policyCode: decision.blockCode,
      policyReason: decision.blockReason,
      authContext: { roles: input.roles },
    })

    return decision
  }

  const promptScan = scanForPromptInjection(input.prompt)
  let chunkScan = { riskScore: 0, flags: [] as string[], blocked: false, sanitizedText: '', redactions: [] as string[] }
  if (input.retrievedChunks?.length) {
    const scanned = scanRetrievedChunks(input.retrievedChunks)
    chunkScan = {
      riskScore: scanned.riskScore,
      flags: scanned.flags,
      blocked: scanned.blocked,
      sanitizedText: scanned.sanitizedText,
      redactions: scanned.redactions,
    }
  }

  const injectionRiskScore = Math.max(promptScan.riskScore, chunkScan.riskScore)
  const injectionFlags = [...new Set([...promptScan.flags, ...chunkScan.flags])]
  const blocked = promptScan.blocked || chunkScan.blocked

  if (blocked) {
    const decision: AiPolicyDecision = {
      allowed: false,
      blockCode: 'AI_INJECTION_BLOCKED',
      blockReason: 'Input failed prompt-injection / poisoning policy checks',
      sanitizedPrompt: promptScan.sanitizedText,
      redactions: [...new Set([...promptScan.redactions, ...chunkScan.redactions])],
      injectionRiskScore,
      injectionFlags,
      rateLimited: false,
      toolKillSwitchActive: killSwitch,
      policyVersion: AI_POLICY_VERSION,
    }

    await recordAiPolicyAudit({
      surface: input.surface,
      route: input.route,
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      promptPreview: input.prompt,
      policyDecision: 'blocked',
      policyCode: decision.blockCode,
      policyReason: decision.blockReason,
      injectionRiskScore,
      injectionFlags,
      retrievedChunkCount: input.retrievedChunks?.length,
      authContext: { roles: input.roles },
    })

    return decision
  }

  const decision: AiPolicyDecision = {
    allowed: true,
    sanitizedPrompt: promptScan.sanitizedText,
    redactions: promptScan.redactions,
    injectionRiskScore,
    injectionFlags,
    rateLimited: false,
    toolKillSwitchActive: killSwitch,
    policyVersion: AI_POLICY_VERSION,
  }

  await recordAiPolicyAudit({
    surface: input.surface,
    route: input.route,
    tenantId: input.tenantId,
    userId: input.userId,
    sessionId: input.sessionId,
    promptPreview: input.prompt,
    policyDecision: 'allowed',
    injectionRiskScore,
    injectionFlags: injectionFlags.length ? injectionFlags : undefined,
    retrievedChunkCount: input.retrievedChunks?.length,
    authContext: { roles: input.roles },
  })

  return decision
}
