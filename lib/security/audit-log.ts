/**
 * Audit Logging Service (Layer 8)
 * Immutable audit trail for compliance and security
 */

import { prisma } from '@/lib/db/prisma'

export interface AuditLogData {
  orgId: string
  userId: string
  action: string
  resourceType?: string
  resourceId?: string
  changes?: {
    before?: any
    after?: any
  }
  ipAddress?: string
  userAgent?: string
  status?: 'success' | 'failure'
  errorMessage?: string
}

/**
 * Create an audit log entry (immutable)
 * Maps to existing AuditLog schema structure
 */
export async function auditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: data.resourceType || 'system',
        entityId: data.resourceId || 'unknown',
        changedBy: data.userId,
        changeSummary: `${data.action} - ${data.status || 'success'}`,
        beforeSnapshot: data.changes?.before || null,
        afterSnapshot: data.changes?.after || null,
        tenantId: data.orgId,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    // Don't throw - audit logging should never break the application
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Get audit logs for an organization (admin only)
 */
export async function getAuditLogs(
  orgId: string,
  filters?: {
    action?: string
    userId?: string
    resourceType?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }
) {
  return prisma.auditLog.findMany({
    where: {
      tenantId: orgId,
      ...(filters?.resourceType && { entityType: filters.resourceType }),
      ...(filters?.userId && { changedBy: filters.userId }),
      ...(filters?.startDate && { timestamp: { gte: filters.startDate } }),
      ...(filters?.endDate && { timestamp: { lte: filters.endDate } }),
      ...(filters?.action && { changeSummary: { contains: filters.action } }),
    },
    orderBy: { timestamp: 'desc' },
    take: filters?.limit || 1000,
  })
}

