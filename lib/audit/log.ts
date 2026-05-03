// @ts-nocheck
/**
 * Audit trail: log key actions for Finance, HR, etc.
 * Uses existing AuditLog model (entityType, entityId, changedBy, changeSummary, beforeSnapshot, afterSnapshot).
 */

import { prisma } from '@/lib/db/prisma'

export type AuditModule = 'finance' | 'hr' | 'crm' | 'sales' | 'marketing' | 'inventory' | 'portal' | 'system'

export interface LogAuditParams {
  module: AuditModule
  action: string
  entityType: string
  entityId: string
  tenantId: string
  userId: string
  diff?: { before?: Record<string, unknown>; after?: Record<string, unknown> }
  summary?: string
  ipAddress?: string | null
  userAgent?: string | null
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const {
      module,
      action,
      entityType,
      entityId,
      tenantId,
      userId,
      diff,
      summary,
      ipAddress,
      userAgent,
    } = params
    const changeSummary = summary ?? `${module}:${action}`
    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        changedBy: userId,
        changeSummary,
        beforeSnapshot: diff?.before ?? undefined,
        afterSnapshot: diff?.after ?? undefined,
        tenantId,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    })
  } catch (e) {
    console.error('[AUDIT]', e)
  }
}
