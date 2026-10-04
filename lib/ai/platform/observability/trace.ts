/**
 * Emit structured AI traces to immutable audit log.
 */

import { redactSensitive } from '@/lib/security/redact-sensitive'
import type { AiTraceRecord } from './log-schema'

export async function emitAiTrace(trace: AiTraceRecord): Promise<void> {
  if (process.env.AI_AUDIT_DISABLED === '1') return

  const payload = redactSensitive(trace)

  try {
    const { prisma } = await import('@/lib/db/prisma')
    await prisma.auditLog.create({
      data: {
        tenantId: trace.tenantId,
        entityType: 'ai_trace',
        entityId: trace.interactionId,
        changedBy: trace.principal.userId,
        changeSummary: `ai_trace:${trace.workflow.id}:${trace.outcome.status}`,
        afterSnapshot: payload as object,
      },
    })
  } catch (error) {
    console.error('[ai-trace] persist failed', error)
  }
}
