// @ts-nocheck
/**
 * CRM audit logging: write to AuditLog for contact/deal create, update, delete.
 * Use from API routes after the mutation; pass tenantId and userId from requireModuleAccess.
 */

import { prisma } from '@/lib/db/prisma'

export type AuditAction = 'create' | 'update' | 'delete'

export async function logCrmAudit(params: {
  tenantId: string
  userId: string
  entityType: 'contact' | 'deal' | 'lead' | 'task'
  entityId: string
  action: AuditAction
  changeSummary: string
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        entityType: params.entityType,
        entityId: params.entityId,
        changedBy: params.userId,
        changeSummary: params.changeSummary,
        beforeSnapshot: params.beforeSnapshot ?? undefined,
        afterSnapshot: params.afterSnapshot ?? undefined,
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
      },
    })
  } catch (err) {
    console.error('CRM audit log write failed:', err)
  }
}
