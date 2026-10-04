/**
 * Layer 1 — shared AI ingress: normalize → classify → policy gateway.
 */

import { enforceAiPolicyGateway } from '@/lib/security/ai-policy'
import type { AiSurface } from '@/lib/security/ai-policy'
import type { IngressContext, IngressResult, NormalizedAiInput } from '../types'
import { normalizeAiInput } from './normalize'
import { classifyAiInput } from './classify'

export const AI_INGRESS_VERSION = '2026-06-12-v1'

export async function handleAiIngress(params: {
  raw: string
  surface: AiSurface
  route: string
  channel: NormalizedAiInput['channel']
  ctx: IngressContext
  retrievedChunks?: string[]
  metadata?: Record<string, unknown>
}): Promise<IngressResult> {
  const normalizedInput = normalizeAiInput({
    raw: params.raw,
    surface: params.surface,
    route: params.route,
    channel: params.channel,
    metadata: params.metadata,
  })

  const classification = classifyAiInput(normalizedInput.normalized)

  const policy = await enforceAiPolicyGateway({
    surface: params.surface,
    route: params.route,
    tenantId: params.ctx.tenantId,
    userId: params.ctx.userId,
    roles: params.ctx.roles,
    prompt: normalizedInput.normalized,
    retrievedChunks: params.retrievedChunks,
    sessionId: params.ctx.sessionId,
  })

  if (!policy.allowed) {
    return {
      allowed: false,
      blockCode: policy.blockCode,
      blockReason: policy.blockReason,
      normalizedInput,
      classification,
      sanitizedText: policy.sanitizedPrompt,
      retrievedChunks: params.retrievedChunks,
      policyVersion: policy.policyVersion,
    }
  }

  if (classification.risk === 'critical') {
    return {
      allowed: false,
      blockCode: 'AI_INGRESS_HIGH_RISK',
      blockReason: 'Request classified as critical risk before model execution',
      normalizedInput,
      classification,
      sanitizedText: policy.sanitizedPrompt,
      retrievedChunks: params.retrievedChunks,
      policyVersion: policy.policyVersion,
    }
  }

  return {
    allowed: true,
    normalizedInput,
    classification,
    sanitizedText: policy.sanitizedPrompt,
    retrievedChunks: params.retrievedChunks,
    policyVersion: policy.policyVersion,
  }
}
