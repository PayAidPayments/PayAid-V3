// @ts-nocheck — Audit log JSON payloads vs Prisma Json input narrowing.
import type { PrismaClient } from '@prisma/client'

export type CreateAuditLogParams = {
  prisma: PrismaClient
  tenantId: string
  userId: string
  entityType: string
  entityId: string
  changeSummary: string
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Write an audit log entry for payroll, contract, or other entity changes.
 * Used by HR (payroll runs) and CRM/legal (contracts).
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  const {
    prisma,
    tenantId,
    userId,
    entityType,
    entityId,
    changeSummary,
    beforeSnapshot = null,
    afterSnapshot = null,
    ipAddress = null,
    userAgent = null,
  } = params

  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        changedBy: userId,
        entityType,
        entityId,
        changeSummary,
        beforeSnapshot: beforeSnapshot ? (beforeSnapshot as object) : null,
        afterSnapshot: afterSnapshot ? (afterSnapshot as object) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (e) {
    console.error('[createAuditLog]', e)
    // Do not throw; audit failure should not break the main operation
  }
}
