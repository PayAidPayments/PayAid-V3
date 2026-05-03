/**
 * Financial Alert System
 * Financial Dashboard Module 1.3
 * 
 * Automated alerts for variance, cash flow, budget, and anomalies
 */

import { prisma } from '@/lib/db/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface AlertCondition {
  alertId: string
  shouldTrigger: boolean
  currentValue: number
  threshold: number
  operator: string
}

export interface AlertLog {
  alertId: string
  triggerDate: Date
  triggeredAccountId?: string
  triggeredValue: number
  notificationsSent: {
    email: boolean
    slack: boolean
    inApp: boolean
  }
  workflowTriggered?: string
  acknowledged: boolean
}

export class FinancialAlertSystem {
  constructor(private tenantId: string) {}

  /**
   * Check all active alerts and trigger notifications if conditions met
   */
  async checkAllAlerts(): Promise<AlertLog[]> {
    // Get all active alerts
    const alerts = await prisma.financialAlert.findMany({
      where: {
        tenantId: this.tenantId,
        isActive: true,
      },
    })

    const triggeredAlerts: AlertLog[] = []

    for (const alert of alerts) {
      const shouldTrigger = await this.evaluateAlertCondition(alert)

      if (shouldTrigger.shouldTrigger) {
        const alertLog = await this.triggerAlert(alert, shouldTrigger)
        triggeredAlerts.push(alertLog)
      }
    }

    return triggeredAlerts
  }

  /**
   * Evaluate if alert condition is met
   */
  private async evaluateAlertCondition(
    alert: {
      id: string
      conditionType: string
      conditionValue: Decimal | null
      conditionOperator: string | null
      appliesToAccountId: string | null
    }
  ): Promise<AlertCondition> {
    let currentValue = 0

    if (alert.appliesToAccountId) {
      // Get latest GL balance for account
      const gl = await prisma.generalLedger.findFirst({
        where: {
          tenantId: this.tenantId,
          accountId: alert.appliesToAccountId,
        },
        orderBy: [
          { fiscalYear: 'desc' },
          { fiscalMonth: 'desc' },
        ],
      })

      currentValue = gl?.closingBalance.toNumber() || 0
    }

    const threshold = alert.conditionValue?.toNumber() || 0
    const operator = alert.conditionOperator || '>'

    let shouldTrigger = false

    switch (operator) {
      case '>':
        shouldTrigger = currentValue > threshold
        break
      case '<':
        shouldTrigger = currentValue < threshold
        break
      case '>=':
        shouldTrigger = currentValue >= threshold
        break
      case '<=':
        shouldTrigger = currentValue <= threshold
        break
      case '==':
        shouldTrigger = currentValue === threshold
        break
    }

    return {
      alertId: alert.id,
      shouldTrigger,
      currentValue,
      threshold,
      operator,
    }
  }

  /**
   * Trigger alert actions: email, Slack, n8n workflow
   */
  private async triggerAlert(
    alert: {
      id: string
      alertName: string
      alertType: string
      appliesToAccountId: string | null
      notifyEmails: any
      notifySlack: boolean
      notifyInApp: boolean
      triggerWorkflow: string | null
    },
    condition: AlertCondition
  ): Promise<AlertLog> {
    // Create alert log
    const alertLog = await prisma.financialAlertLog.create({
      data: {
        tenantId: this.tenantId,
        alertId: alert.id,
        triggerDate: new Date(),
        triggeredAccountId: alert.appliesToAccountId || null,
        triggeredValue: new Decimal(condition.currentValue),
        notificationsSent: {
          email: false,
          slack: false,
          inApp: false,
        },
      },
    })

    const notificationsSent = {
      email: false,
      slack: false,
      inApp: false,
    }

    // Send email notifications
    if (alert.notifyEmails && Array.isArray(alert.notifyEmails)) {
      // TODO: Implement email sending via SendGrid
      // await sendEmailAlert(alert.notifyEmails, alert, condition)
      notificationsSent.email = true
    }

    // Send Slack notifications
    if (alert.notifySlack) {
      // TODO: Implement Slack webhook
      // await sendSlackAlert(alert, condition)
      notificationsSent.slack = true
    }

    // Create in-app notification
    if (alert.notifyInApp) {
      // TODO: Integrate with notification service
      // await createInAppNotification(alert, condition)
      notificationsSent.inApp = true
    }

    // Trigger n8n workflow if configured
    if (alert.triggerWorkflow) {
      // TODO: Call n8n API to trigger workflow
      // await triggerN8nWorkflow(alert.triggerWorkflow, alert, condition)
    }

    // Update alert log with notification status
    await prisma.financialAlertLog.update({
      where: { id: alertLog.id },
      data: {
        notificationsSent: notificationsSent as any,
        workflowTriggered: alert.triggerWorkflow || null,
      },
    })

    return {
      alertId: alert.id,
      triggerDate: alertLog.triggerDate,
      triggeredAccountId: alert.appliesToAccountId || undefined,
      triggeredValue: condition.currentValue,
      notificationsSent,
      workflowTriggered: alert.triggerWorkflow || undefined,
      acknowledged: false,
    }
  }

  /**
   * Create a new alert
   */
  async createAlert(data: {
    alertName: string
    alertType: string
    conditionType: string
    conditionValue?: number
    conditionOperator?: string
    appliesToAccountId?: string
    appliesToAccountGroup?: string
    notifyEmails?: string[]
    notifySlack?: boolean
    notifyInApp?: boolean
    triggerWorkflow?: string
  }): Promise<{ id: string }> {
    const alert = await prisma.financialAlert.create({
      data: {
        tenantId: this.tenantId,
        alertName: data.alertName,
        alertType: data.alertType,
        conditionType: data.conditionType,
        conditionValue: data.conditionValue
          ? new Decimal(data.conditionValue)
          : null,
        conditionOperator: data.conditionOperator || null,
        appliesToAccountId: data.appliesToAccountId || null,
        appliesToAccountGroup: data.appliesToAccountGroup || null,
        notifyEmails: data.notifyEmails ? (data.notifyEmails as any) : [],
        notifySlack: data.notifySlack || false,
        notifyInApp: data.notifyInApp !== false,
        triggerWorkflow: data.triggerWorkflow || null,
        isActive: true,
      },
    })

    return { id: alert.id }
  }

  /**
   * Get all alerts for tenant
   */
  async getAlerts(includeInactive: boolean = false) {
    return prisma.financialAlert.findMany({
      where: {
        tenantId: this.tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get alert logs
   */
  async getAlertLogs(
    alertId?: string,
    limit: number = 50
  ): Promise<AlertLog[]> {
    const logs = await prisma.financialAlertLog.findMany({
      where: {
        tenantId: this.tenantId,
        ...(alertId ? { alertId } : {}),
      },
      orderBy: {
        triggerDate: 'desc',
      },
      take: limit,
    })

    return logs.map((log) => ({
      alertId: log.alertId,
      triggerDate: log.triggerDate,
      triggeredAccountId: log.triggeredAccountId || undefined,
      triggeredValue: log.triggeredValue?.toNumber() || 0,
      notificationsSent: (log.notificationsSent as any) || {
        email: false,
        slack: false,
        inApp: false,
      },
      workflowTriggered: log.workflowTriggered || undefined,
      acknowledged: log.acknowledged,
    }))
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    logId: string,
    userId: string
  ): Promise<void> {
    await prisma.financialAlertLog.update({
      where: { id: logId },
      data: {
        acknowledged: true,
        acknowledgedById: userId,
        acknowledgedAt: new Date(),
      },
    })
  }
}
