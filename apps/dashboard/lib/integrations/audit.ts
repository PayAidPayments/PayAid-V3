import { prisma } from '@/lib/db/prisma'

type IntegrationAuditInput = {
  tenantId: string
  userId: string | null | undefined
  entityType: string
  entityId: string
  action: string
  after?: Record<string, unknown>
}

export async function writeIntegrationAudit(input: IntegrationAuditInput): Promise<void> {
  await prisma.auditLog
    .create({
      data: {
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        changedBy: input.userId || 'system',
        changeSummary: input.action,
        afterSnapshot: (input.after || {}) as any,
      },
    })
    .catch(() => undefined)
}

