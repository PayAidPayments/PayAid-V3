/**
 * Operations Module Seeder for Demo Business
 * Seeds: Audit Logs, Automation Runs, Notifications
 * Date Range: March 2025 - February 2026
 */

import type { PrismaClient } from '@prisma/client'
import { DateRange, DEMO_DATE_RANGE, randomDateInRange } from './date-utils'
import { requirePrismaClient } from './prisma-utils'

export interface OperationsSeedResult {
  auditLogs: number
  automationRuns: number
  notifications: number
}

export async function seedOperationsModule(
  tenantId: string,
  userId: string,
  range: DateRange = DEMO_DATE_RANGE,
  prismaClient: PrismaClient
): Promise<OperationsSeedResult> {
  const prisma = requirePrismaClient(prismaClient)
  console.log('⚙️  Seeding Operations Module...')

  // Operations models may not exist in this schema; skip safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyPrisma = prisma as any
  const hasAuditLog = !!anyPrisma.auditLog
  const hasAutomationRun = !!anyPrisma.automationRun
  const hasNotification = !!anyPrisma.notification

  if (!hasAuditLog && !hasAutomationRun && !hasNotification) {
    console.log('  ⚠ Operations models not available in this schema, skipping Operations seeding')
    return { auditLogs: 0, automationRuns: 0, notifications: 0 }
  }

  // 1. AUDIT LOGS - 1000 audit logs across 12 months
  const actions = ['create', 'update', 'delete', 'view', 'export']
  const entities = ['contact', 'deal', 'task', 'order', 'invoice', 'campaign', 'ticket']
  
  const auditLogs = hasAuditLog
    ? await Promise.all(
        Array.from({ length: 250 }, (_, i) => {
          // NOTE: AuditLog schema varies; keep best-effort and never crash seeding
          const action = actions[Math.floor(Math.random() * actions.length)]
          const entity = entities[Math.floor(Math.random() * entities.length)]
          const timestamp = randomDateInRange(range)

          return anyPrisma.auditLog
            .create({
              data: {
                tenantId,
                entityType: entity,
                entityId: `entity-${i + 1}`,
                changedBy: userId,
                changeSummary: `${action} ${entity}`,
                createdAt: timestamp,
              },
            })
            .catch(() => null)
        })
      )
    : []

  console.log(`  ✓ Created ${auditLogs.filter(Boolean).length} audit logs`)

  // 2. AUTOMATION RUNS - 200 automation runs
  const automationTriggers = [
    'lead_created',
    'deal_won',
    'invoice_paid',
    'ticket_created',
    'contact_updated',
    'task_completed',
  ]
  
  const automationRuns = hasAutomationRun
    ? await Promise.all(
        Array.from({ length: 200 }, (_, i) => {
          const trigger = automationTriggers[Math.floor(Math.random() * automationTriggers.length)]
          const timestamp = randomDateInRange(range)
          const status = ['success', 'failed', 'pending'][Math.floor(Math.random() * 3)]

          return anyPrisma.automationRun
            .create({
              data: {
                tenantId,
                trigger,
                status,
                inputData: { example: 'data' },
                outputData: status === 'success' ? { result: 'success' } : null,
                errorMessage: status === 'failed' ? 'Sample error message' : null,
                startedAt: timestamp,
                completedAt: status !== 'pending' ? new Date(timestamp.getTime() + Math.random() * 60000) : null,
                createdAt: timestamp,
              },
            })
            .catch(() => null)
        })
      )
    : []

  console.log(`  ✓ Created ${automationRuns.filter(Boolean).length} automation runs`)

  // 3. NOTIFICATIONS - 500 notifications
  const notificationTypes = ['deal_won', 'task_due', 'invoice_overdue', 'ticket_assigned', 'campaign_completed']
  
  const notifications = hasNotification
    ? await Promise.all(
        Array.from({ length: 500 }, (_, i) => {
          const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
          const timestamp = randomDateInRange(range)
          const isRead = Math.random() > 0.3 // 70% read

          return anyPrisma.notification
            .create({
              data: {
                tenantId,
                userId,
                type,
                title: `Notification: ${type}`,
                message: `Notification message for ${type}`,
                isRead,
                readAt: isRead ? randomDateInRange({ start: timestamp, end: range.end }) : null,
                createdAt: timestamp,
              },
            })
            .catch(() => null)
        })
      )
    : []

  console.log(`  ✓ Created ${notifications.filter(Boolean).length} notifications`)

  return {
    auditLogs: auditLogs.filter(Boolean).length,
    automationRuns: automationRuns.filter(Boolean).length,
    notifications: notifications.filter(Boolean).length,
  }
}
