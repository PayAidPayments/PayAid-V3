/**
 * Operations Module Seeder for Demo Business
 * Seeds: Audit Logs, Automation Runs, Notifications
 * Date Range: March 2025 - February 2026
 */

import type { PrismaClient } from '@prisma/client'
import { DateRange, DEMO_DATE_RANGE, randomDateInRange, getMonthsInRange } from './date-utils'
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

  // 1. AUDIT LOGS - 1000 audit logs distributed across ALL 12 months (Mar 2025 - Feb 2026)
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  const actions = ['create', 'update', 'delete', 'view', 'export']
  const entities = ['contact', 'deal', 'task', 'order', 'invoice', 'campaign', 'ticket']
  const months = getMonthsInRange(range)
  const logsPerMonth = Math.floor(250 / months.length) // ~21 logs per month
  
  const auditLogData: Array<{
    tenantId: string
    entityType: string
    entityId: string
    changedBy: string
    changeSummary: string
    createdAt: Date
  }> = []
  
  let logIndex = 0
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const logsThisMonth = monthIdx === months.length - 1 
      ? 250 - logIndex // Last month gets remaining logs
      : logsPerMonth
    
    for (let i = 0; i < logsThisMonth && logIndex < 250; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)]
      const entity = entities[Math.floor(Math.random() * entities.length)]
      const timestamp = randomDateInRange({ start: monthStart, end: monthEnd })
      
      auditLogData.push({
        tenantId,
        entityType: entity,
        entityId: `entity-${logIndex + 1}`,
        changedBy: userId,
        changeSummary: `${action} ${entity}`,
        createdAt: timestamp,
      })
      logIndex++
    }
  }
  
  const auditLogs = hasAuditLog
    ? await Promise.all(
        auditLogData.map((logData) => {
          // NOTE: AuditLog schema varies; keep best-effort and never crash seeding

          return anyPrisma.auditLog
            .create({
              data: logData,
            })
            .catch(() => null)
        })
      )
    : []

  console.log(`  ✓ Created ${auditLogs.filter(Boolean).length} audit logs`)

  // 2. AUTOMATION RUNS - 200 automation runs distributed across ALL 12 months
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  const automationTriggers = [
    'lead_created',
    'deal_won',
    'invoice_paid',
    'ticket_created',
    'contact_updated',
    'task_completed',
  ]
  
  const automationRunsPerMonth = Math.floor(200 / months.length) // ~17 runs per month
  const automationRunData: Array<{
    tenantId: string
    trigger: string
    status: string
    inputData: {}
    outputData: {} | null
    errorMessage: string | null
    startedAt: Date
    completedAt: Date | null
    createdAt: Date
  }> = []
  
  let automationIndex = 0
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const runsThisMonth = monthIdx === months.length - 1 
      ? 200 - automationIndex // Last month gets remaining runs
      : automationRunsPerMonth
    
    for (let i = 0; i < runsThisMonth && automationIndex < 200; i++) {
      const trigger = automationTriggers[Math.floor(Math.random() * automationTriggers.length)]
      const timestamp = randomDateInRange({ start: monthStart, end: monthEnd })
      const status = ['success', 'failed', 'pending'][Math.floor(Math.random() * 3)]
      
      automationRunData.push({
        tenantId,
        trigger,
        status,
        inputData: { example: 'data' },
        outputData: status === 'success' ? { result: 'success' } : null,
        errorMessage: status === 'failed' ? 'Sample error message' : null,
        startedAt: timestamp,
        completedAt: status !== 'pending' ? new Date(timestamp.getTime() + Math.random() * 60000) : null,
        createdAt: timestamp,
      })
      automationIndex++
    }
  }
  
  const automationRuns = hasAutomationRun
    ? await Promise.all(
        automationRunData.map((runData) => {
          return anyPrisma.automationRun
            .create({
              data: runData,
            })
            .catch(() => null)
        })
      )
    : []

  console.log(`  ✓ Created ${automationRuns.filter(Boolean).length} automation runs`)

  // 3. NOTIFICATIONS - 500 notifications distributed across ALL 12 months
  // CRITICAL: Ensure data spans entire range, not clustered in Jan/Feb
  const notificationTypes = ['deal_won', 'task_due', 'invoice_overdue', 'ticket_assigned', 'campaign_completed']
  const notificationsPerMonth = Math.floor(500 / months.length) // ~42 notifications per month
  const notificationData: Array<{
    tenantId: string
    userId: string
    type: string
    title: string
    message: string
    isRead: boolean
    readAt: Date | null
    createdAt: Date
  }> = []
  
  let notificationIndex = 0
  for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
    const month = months[monthIdx]
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    const notificationsThisMonth = monthIdx === months.length - 1 
      ? 500 - notificationIndex // Last month gets remaining notifications
      : notificationsPerMonth
    
    for (let i = 0; i < notificationsThisMonth && notificationIndex < 500; i++) {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
      const timestamp = randomDateInRange({ start: monthStart, end: monthEnd })
      const isRead = Math.random() > 0.3 // 70% read
      
      notificationData.push({
        tenantId,
        userId,
        type,
        title: `Notification: ${type}`,
        message: `Notification message for ${type}`,
        isRead,
        readAt: isRead ? randomDateInRange({ start: timestamp, end: range.end }) : null,
        createdAt: timestamp,
      })
      notificationIndex++
    }
  }
  
  const notifications = hasNotification
    ? await Promise.all(
        notificationData.map((notifData) => {
          return anyPrisma.notification
            .create({
              data: notifData,
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
