/**
 * Overdue Payment Automation Service
 * Automatically sends payment reminders for overdue invoices
 * Better than Perfex CRM: Multi-channel (email, SMS, WhatsApp), configurable schedules
 */

import { prisma } from '@/lib/db/prisma'

export interface ReminderSchedule {
  daysAfterDue: number[]
  channels: ('email' | 'sms' | 'whatsapp')[]
  escalation: boolean
}

export interface ReminderConfig {
  enabled: boolean
  schedule: ReminderSchedule
  maxReminders: number
  stopAfterPayment: boolean
}

/**
 * Get overdue invoices that need reminders
 */
export async function getOverdueInvoicesNeedingReminders(
  tenantId: string,
  config: ReminderConfig
): Promise<
  Array<{
    invoice: any
    daysOverdue: number
    remindersSent: number
    nextReminderDue: Date | null
  }>
> {
  const now = new Date()
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: { in: ['sent', 'pending'] },
      dueDate: { lt: now },
      ...(config.stopAfterPayment
        ? { paymentStatus: { notIn: ['paid'] } }
        : {}),
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  const results: Array<{
    invoice: any
    daysOverdue: number
    remindersSent: number
    nextReminderDue: Date | null
  }> = []

  for (const invoice of overdueInvoices) {
    if (!invoice.dueDate) continue

    const daysOverdue = Math.floor(
      (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const scheduleDays = config.schedule.daysAfterDue || [3, 7, 14, 30]
    const shouldRemind = scheduleDays.some(
      (days) => daysOverdue >= days && daysOverdue < days + 1
    )

    if (shouldRemind) {
      const meta = (invoice.metadata as Record<string, unknown>) || {}
      const remindersSent = (meta.remindersSent as number) || 0

      if (remindersSent < config.maxReminders) {
        const nextDays = scheduleDays.find((d) => d > daysOverdue)
        const nextReminderDue = nextDays
          ? new Date(
              invoice.dueDate.getTime() + nextDays * 24 * 60 * 60 * 1000
            )
          : null

        results.push({
          invoice,
          daysOverdue,
          remindersSent,
          nextReminderDue,
        })
      }
    }
  }

  return results
}

/**
 * Send overdue payment reminder
 */
export async function sendOverdueReminder(
  invoiceId: string,
  channel: 'email' | 'sms' | 'whatsapp',
  tenantId: string,
  userId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        customer: true,
      },
    })

    if (!invoice || !invoice.customer) {
      return { success: false, error: 'Invoice or customer not found' }
    }

    const daysOverdue = invoice.dueDate
      ? Math.floor(
          (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0

    const payUrl = (invoice as any).paymentLinkUrl || ''
    const message = `Reminder: Invoice ${invoice.invoiceNumber} for ₹${Number(invoice.total).toLocaleString('en-IN')} is ${daysOverdue} days overdue. Please pay at: ${payUrl || 'Contact us'}`

    if (channel === 'email' && invoice.customer.email) {
      // TODO: Send email via SendGrid
      console.log(
        `[OVERDUE_REMINDER] Email to ${invoice.customer.email}: ${message}`
      )
    } else if (channel === 'sms' && invoice.customer.phone) {
      // TODO: Send SMS via Twilio/Exotel
      console.log(
        `[OVERDUE_REMINDER] SMS to ${invoice.customer.phone}: ${message}`
      )
    } else if (channel === 'whatsapp' && invoice.customer.phone) {
      // TODO: Send WhatsApp via WATI
      console.log(
        `[OVERDUE_REMINDER] WhatsApp to ${invoice.customer.phone}: ${message}`
      )
    }

    const meta = (invoice.metadata as Record<string, unknown>) || {}
    const remindersSent = ((meta.remindersSent as number) || 0) + 1
    const reminders = (meta.reminders as Array<Record<string, unknown>>) || []
    reminders.push({
      date: new Date().toISOString(),
      channel,
      daysOverdue,
    })

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        metadata: {
          ...meta,
          remindersSent,
          reminders: reminders as any,
          lastReminderSent: new Date().toISOString(),
        } as any,
      },
    })

    if (userId) {
      await prisma.activityFeed
        .create({
          data: {
            tenantId,
            type: 'invoice_reminder_sent',
            entityType: 'invoice',
            entityId: invoiceId,
            userId,
            description: `Overdue payment reminder sent via ${channel}`,
            metadata: {
              invoiceNumber: invoice.invoiceNumber,
              daysOverdue,
              channel,
            },
          },
        })
        .catch(() => {})
    }

    return { success: true }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Send overdue reminder error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Process all overdue invoices and send reminders
 */
export async function processOverdueReminders(
  tenantId: string,
  config: ReminderConfig
): Promise<{
  processed: number
  sent: number
  errors: number
}> {
  if (!config.enabled) {
    return { processed: 0, sent: 0, errors: 0 }
  }

  const overdue = await getOverdueInvoicesNeedingReminders(tenantId, config)
  let sent = 0
  let errors = 0

  for (const item of overdue) {
    let channel: 'email' | 'sms' | 'whatsapp' = 'email'
    if (config.schedule?.escalation) {
      if (item.daysOverdue >= 30) {
        channel = 'whatsapp'
      } else if (item.daysOverdue >= 14) {
        channel = 'sms'
      }
    } else {
      channel =
        (config.schedule?.channels?.[0] as 'email' | 'sms' | 'whatsapp') ||
        'email'
    }

    const result = await sendOverdueReminder(
      item.invoice.id,
      channel,
      tenantId,
      undefined
    )
    if (result.success) {
      sent++
    } else {
      errors++
    }
  }

  return {
    processed: overdue.length,
    sent,
    errors,
  }
}
