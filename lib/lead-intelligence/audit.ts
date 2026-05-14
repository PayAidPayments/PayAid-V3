import { prisma } from '@/lib/db/prisma'

type LeadAuditParams = {
  tenantId: string
  actorId?: string | null
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}

/**
 * Best-effort LI audit writer: never blocks request success.
 */
export async function writeLeadAuditEvent(params: LeadAuditParams): Promise<void> {
  try {
    await prisma.leadAuditEvent.create({
      data: {
        tenantId: params.tenantId,
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ?? {},
      },
    })
  } catch (error) {
    console.warn('[lead-intelligence/audit] failed to write event:', error)
  }
}
