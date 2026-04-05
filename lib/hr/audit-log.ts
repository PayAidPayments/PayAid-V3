// @ts-nocheck
import { prisma } from '@/lib/db/prisma'

export type AuditEntityType = 'PayrollRun' | 'Contract' | 'Employee' | 'Contractor'

/**
 * Create an audit log entry for payroll, contract, or other HR-related changes.
 * Used by payroll run PATCH and contract PATCH to record who changed what.
 */
export async function createAuditLog(params: {
  tenantId: string
  userId: string
  entityType: AuditEntityType
  entityId: string
  changeSummary: string
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
  request?: { ipAddress?: string | null; userAgent?: string | null }
}): Promise<void> {
  const { tenantId, userId, entityType, entityId, changeSummary, beforeSnapshot, afterSnapshot, request } = params
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        changedBy: userId,
        entityType,
        entityId,
        changeSummary,
        beforeSnapshot: beforeSnapshot ?? undefined,
        afterSnapshot: afterSnapshot ?? undefined,
        ipAddress: request?.ipAddress ?? null,
        userAgent: request?.userAgent ?? null,
      },
    })
  } catch (e) {
    console.error('[audit-log] Failed to write audit log:', e)
    // Do not throw – audit is non-blocking
  }
}
