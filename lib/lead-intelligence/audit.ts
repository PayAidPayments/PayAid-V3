import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

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
    // Model may lag generated client on some branches; keep best-effort write typed-safe.
    const audit = (prisma as unknown as {
      leadAuditEvent?: { create: (args: { data: Record<string, unknown> }) => Promise<unknown> }
    }).leadAuditEvent
    if (!audit?.create) return
    await audit.create({
      data: {
        tenantId: params.tenantId,
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: toInputJson(params.metadata ?? {}),
      },
    })
  } catch (error) {
    console.warn('[lead-intelligence/audit] failed to write event:', error)
  }
}
