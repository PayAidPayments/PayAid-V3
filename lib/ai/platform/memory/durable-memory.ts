/**
 * Validated durable memory — only user-approved or policy-validated summaries persist.
 */

import { prisma } from '@/lib/db/prisma'
import { scanForPromptInjection } from '@/lib/security/ai-policy/prompt-injection-scanner'

export interface DurableMemoryProposal {
  tenantId: string
  userId: string
  sessionId: string
  summary: string
  userApproved: boolean
  sourceWorkflowId?: string
}

export async function proposeDurableMemory(proposal: DurableMemoryProposal): Promise<{
  stored: boolean
  reason?: string
}> {
  if (!proposal.userApproved) {
    return { stored: false, reason: 'User approval required for durable memory' }
  }

  const scan = scanForPromptInjection(proposal.summary)
  if (scan.blocked || scan.riskScore >= 0.55) {
    return { stored: false, reason: 'Summary failed memory poisoning checks' }
  }

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: proposal.tenantId,
        entityType: 'ai_durable_memory',
        entityId: proposal.sessionId,
        changedBy: proposal.userId,
        changeSummary: `durable_memory:${proposal.sourceWorkflowId || 'manual'}`,
        afterSnapshot: {
          summary: scan.sanitizedText,
          validatedAt: new Date().toISOString(),
          riskScore: scan.riskScore,
        },
      },
    })
    return { stored: true }
  } catch {
    return { stored: false, reason: 'Failed to persist durable memory' }
  }
}
