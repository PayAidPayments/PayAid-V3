/**
 * Public / visitor AI surfaces — tenant from resource, not JWT module gate.
 * Used by website chatbot and similar unauthenticated LLM entry points.
 */

import { finalizeAiRuntime, prepareAiRuntime, type AiRuntimeResult } from './ai-runtime-runner'
import type { AiSurface } from '@/lib/security/ai-policy'

export const WEBSITE_CHATBOT_SYSTEM_USER = 'website_chatbot_visitor'

export async function enforceVisitorAiRuntime(params: {
  tenantId: string
  visitorId: string
  prompt: string
  surface: AiSurface
  route: string
  sessionId?: string
  retrievedChunks?: string[]
}): Promise<AiRuntimeResult> {
  return prepareAiRuntime({
    prompt: params.prompt,
    surface: params.surface,
    route: params.route,
    channel: 'api',
    tenantId: params.tenantId,
    userId: params.visitorId || WEBSITE_CHATBOT_SYSTEM_USER,
    roles: [],
    sessionId: params.sessionId,
    module: 'crm',
    mode: 'auto',
    retrievedChunks: params.retrievedChunks,
    sensitiveQuestion: false,
  })
}

export { finalizeAiRuntime }
