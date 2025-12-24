/**
 * Background job to check for due tasks
 * Runs every hour to send alerts for tasks due today
 */

import { prisma } from '@/lib/db/prisma'
import { sendTaskAlert } from '@/lib/notifications/send-task-alert'

/**
 * Check for tasks due today and send alerts
 */
export async function checkTaskDue(tenantId?: string) {
  const where: any = {
    dueDate: {
      not: null,
      lte: new Date(), // Due today or past
      gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
    },
    status: {
      not: 'completed',
    },
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  // Get tasks due today
  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignedTo: {
        include: {
          salesRep: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      contact: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  console.log(`Found ${tasks.length} tasks due today`)

  let alertCount = 0

  for (const task of tasks) {
    if (task.assignedTo?.salesRep) {
      try {
        await sendTaskAlert({
          rep: task.assignedTo.salesRep as any,
          task,
          type: 'TASK_DUE',
        })
        alertCount++
      } catch (error) {
        console.error(`Failed to send task alert for ${task.title}:`, error)
      }
    }
  }

  console.log(`Sent ${alertCount} task alerts`)

  return {
    total: tasks.length,
    alertsSent: alertCount,
  }
}
