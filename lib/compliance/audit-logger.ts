/**
 * Audit Logger for Compliance
 * Logs all AI decisions, data access, and sensitive operations
 */

import { prisma } from '@/lib/db/prisma'

export interface AuditLogEntry {
  action: string // e.g., 'insight_generated', 'decision_executed', 'data_accessed'
  dataType: string // e.g., 'revenue_data', 'customer_data', 'invoice'
  tenantId: string
  userId: string
  context: string // Description of what happened
  metadata?: Record<string, any> // Additional context
  ipAddress?: string
  userAgent?: string
}

/**
 * Create audit log entry
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    // Map to existing AuditLog schema
    await prisma.auditLog.create({
      data: {
        entityType: entry.dataType,
        entityId: entry.tenantId, // Store tenantId as entityId for filtering
        changedBy: entry.userId,
        tenantId: entry.tenantId,
        changeSummary: `${entry.action}: ${entry.context}`, // Combine action and context
        beforeSnapshot: {}, // Not applicable for compliance logs
        afterSnapshot: entry.metadata || {}, // Store metadata in afterSnapshot
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get audit logs for a tenant
 */
export async function getAuditLogs(
  tenantId: string,
  options: {
    startDate?: Date
    endDate?: Date
    action?: string
    dataType?: string
    userId?: string
    limit?: number
  } = {}
): Promise<any[]> {
  const {
    startDate,
    endDate,
    action,
    dataType,
    userId,
    limit = 100,
  } = options

  const where: any = {
    tenantId,
  }

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  if (action) {
    // Search in changeSummary field
    where.changeSummary = {
      contains: action,
    }
  }

  if (dataType) {
    where.entityType = dataType
  }

  if (userId) {
    where.changedBy = userId
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  })

  // Map to expected format
  return logs.map((log) => ({
    id: log.id,
    action: log.changeSummary?.split(':')[0] || 'unknown',
    dataType: log.entityType,
    tenantId: log.tenantId,
    userId: log.changedBy,
    context: log.changeSummary || '',
    metadata: log.afterSnapshot || {},
    timestamp: log.timestamp,
  }))
}

/**
 * Log AI decision
 */
export async function logAIDecision(
  tenantId: string,
  userId: string,
  decisionType: string,
  decisionId: string,
  context: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    action: 'ai_decision',
    dataType: decisionType,
    tenantId,
    userId,
    context: `AI Decision: ${context}`,
    metadata: {
      decisionId,
      ...metadata,
    },
  })
}

/**
 * Log data access
 */
export async function logDataAccess(
  tenantId: string,
  userId: string,
  dataType: string,
  resourceId: string,
  context: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    action: 'data_accessed',
    dataType,
    tenantId,
    userId,
    context: `Data Access: ${context}`,
    metadata: {
      resourceId,
      ...metadata,
    },
  })
}

/**
 * Log PII access
 */
export async function logPIIAccess(
  tenantId: string,
  userId: string,
  piiType: string,
  context: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit({
    action: 'pii_accessed',
    dataType: piiType,
    tenantId,
    userId,
    context: `PII Access: ${context}`,
    metadata: {
      piiType,
      ...metadata,
    },
  })
}
