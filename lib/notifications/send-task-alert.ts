/**
 * Task Alert Notification System
 */

import { prisma } from '@/lib/db/prisma'
import type { Task, SalesRep } from '@prisma/client'

interface TaskAlertOptions {
  rep: SalesRep & { user: { name: string; email: string } }
  task: Task & { contact?: { id: string; name: string } | null }
  type: 'TASK_DUE' | 'TASK_OVERDUE'
  channels?: ('email' | 'sms' | 'in-app')[]
}

/**
 * Send task alert notification
 */
export async function sendTaskAlert(options: TaskAlertOptions): Promise<void> {
  const { rep, task, type, channels = ['sms', 'in-app'] } = options

  const priority = task.priority === 'high' ? 'HIGH' : task.priority === 'medium' ? 'MEDIUM' : 'LOW'

  let title = ''
  let message = ''

  switch (type) {
    case 'TASK_DUE':
      title = 'Task Due Today'
      message = `${task.title}${task.contact ? ` - ${task.contact.name}` : ''} is due today`
      break
    case 'TASK_OVERDUE':
      title = '⚠️ Task Overdue'
      message = `${task.title}${task.contact ? ` - ${task.contact.name}` : ''} is overdue`
      break
  }

  // Send via each channel
  const promises: Promise<void>[] = []

  if (channels.includes('email')) {
    promises.push(sendEmailAlert(rep, task, title, message, priority))
  }

  if (channels.includes('sms')) {
    promises.push(sendSMSAlert(rep, task, message, priority))
  }

  // Always save in-app notification
  promises.push(
    prisma.alert.create({
      data: {
        repId: rep.id,
        tenantId: task.tenantId,
        type,
        title,
        message,
        taskId: task.id,
        leadId: task.contactId || undefined,
        channels: ['in-app'],
        priority,
      },
    }).then(() => {})
  )

  await Promise.allSettled(promises)
}

async function sendEmailAlert(
  rep: SalesRep & { user: { name: string; email: string } },
  task: Task,
  title: string,
  message: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
): Promise<void> {
  console.log(`📧 Email to ${rep.user.email}: ${title} - ${message}`)
  // TODO: Integrate with SendGrid
}

async function sendSMSAlert(
  rep: SalesRep & { user: { name: string; email: string } },
  task: Task,
  message: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
): Promise<void> {
  console.log(`📱 SMS to ${rep.user.name}: ${message}`)
  // TODO: Integrate with Twilio/Exotel
}
