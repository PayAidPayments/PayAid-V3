/**
 * Immutable AI policy audit trail (prompt, policy decision, tool context).
 */

import { redactSensitive } from '@/lib/security/redact-sensitive'
import type { AiAuditRecord } from './types'

const PROMPT_PREVIEW_MAX = 500
const RESPONSE_PREVIEW_MAX = 500

function preview(text: string | undefined, max: number): string | undefined {
  if (!text) return undefined
  return text.length <= max ? text : `${text.slice(0, max)}…`
}

export async function recordAiPolicyAudit(event: AiAuditRecord): Promise<void> {
  if (process.env.AI_AUDIT_DISABLED === '1') return

  const payload = redactSensitive({
    surface: event.surface,
    route: event.route,
    sessionId: event.sessionId,
    promptPreview: preview(event.promptPreview, PROMPT_PREVIEW_MAX),
    responsePreview: preview(event.responsePreview, RESPONSE_PREVIEW_MAX),
    modelProvider: event.modelProvider,
    retrievedChunkCount: event.retrievedChunkCount,
    toolId: event.toolId,
    toolCapability: event.toolCapability,
    policyDecision: event.policyDecision,
    policyCode: event.policyCode,
    policyReason: event.policyReason,
    injectionRiskScore: event.injectionRiskScore,
    injectionFlags: event.injectionFlags,
    promptTemplateId: event.promptTemplateId,
    promptTemplateVersion: event.promptTemplateVersion,
    authContext: event.authContext,
    recordedAt: new Date().toISOString(),
  })

  try {
    const { prisma } = await import('@/lib/db/prisma')
    await prisma.auditLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: 'ai_policy_event',
        entityId: event.sessionId || event.route,
        changedBy: event.userId,
        changeSummary: `ai_policy:${event.policyDecision}:${event.surface}`,
        afterSnapshot: payload as object,
      },
    })
  } catch (error) {
    console.error('[ai-policy-audit] failed to persist', error)
  }
}
