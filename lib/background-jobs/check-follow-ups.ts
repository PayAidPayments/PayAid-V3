/**
 * Background job to check for due follow-ups
 * Runs every hour to send alerts for follow-ups due today
 */

import { prisma } from '@/lib/db/prisma'
import { sendLeadAlert } from '@/lib/notifications/send-lead-alert'

/**
 * Check for follow-ups due today and send alerts
 */
export async function checkFollowUps(tenantId?: string) {
  const where: any = {
    nextFollowUp: {
      not: null,
      lte: new Date(), // Due today or past
      gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
    },
    type: 'lead',
    status: 'active',
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  // Get contacts with follow-ups due
  const contacts = await prisma.contact.findMany({
    where,
    include: {
      assignedTo: {
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
  })

  console.log(`Found ${contacts.length} follow-ups due today`)

  let alertCount = 0

  for (const contact of contacts) {
    if (contact.assignedTo) {
      try {
        await sendLeadAlert({
          rep: contact.assignedTo as any,
          contact,
          type: 'FOLLOW_UP_DUE',
          channels: ['sms', 'in-app'], // SMS + In-app for follow-ups
        })
        alertCount++
      } catch (error) {
        console.error(
          `Failed to send follow-up alert for ${contact.name}:`,
          error
        )
      }
    }
  }

  console.log(`Sent ${alertCount} follow-up alerts`)

  return {
    total: contacts.length,
    alertsSent: alertCount,
  }
}

/**
 * Check for hot leads (score >= 70) and send alerts
 */
export async function checkHotLeads(tenantId?: string) {
  const where: any = {
    type: 'lead',
    status: 'active',
    leadScore: {
      gte: 70,
    },
    assignedTo: {
      isNot: null,
    },
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  // Get hot leads assigned in last 24 hours
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const contacts = await prisma.contact.findMany({
    where: {
      ...where,
      scoreUpdatedAt: {
        gte: oneDayAgo, // Score updated in last 24 hours
      },
    },
    include: {
      assignedTo: {
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
  })

  console.log(`Found ${contacts.length} hot leads`)

  let alertCount = 0

  for (const contact of contacts) {
    if (contact.assignedTo) {
      try {
        // Check if alert already sent (avoid duplicates)
        const existingAlert = await prisma.alert.findFirst({
          where: {
            repId: contact.assignedTo.id,
            leadId: contact.id,
            type: 'HOT_LEAD',
            createdAt: {
              gte: oneDayAgo,
            },
          },
        })

        if (!existingAlert) {
          await sendLeadAlert({
            rep: contact.assignedTo as any,
            contact,
            type: 'HOT_LEAD',
            channels: ['sms', 'email', 'in-app'], // Multi-channel for hot leads
          })
          alertCount++
        }
      } catch (error) {
        console.error(`Failed to send hot lead alert for ${contact.name}:`, error)
      }
    }
  }

  console.log(`Sent ${alertCount} hot lead alerts`)

  return {
    total: contacts.length,
    alertsSent: alertCount,
  }
}
