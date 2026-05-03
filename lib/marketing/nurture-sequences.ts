/**
 * Lead Nurturing Sequence Management
 * Handles enrollment, scheduling, and email sending
 */

import { prisma } from '@/lib/db/prisma'

/**
 * Enroll a lead in a nurture sequence
 * Creates enrollment and schedules all emails
 */
export async function enrollLeadInSequence(
  contactId: string,
  templateId: string,
  tenantId: string
) {
  // Get template with steps
  const template = await prisma.nurtureTemplate.findFirst({
    where: {
      id: templateId,
      tenantId,
    },
    include: {
      steps: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!template) {
    throw new Error('Template not found')
  }

  // Get contact
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  })

  if (!contact) {
    throw new Error('Contact not found')
  }

  // Create enrollment
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      contactId,
      templateId,
      tenantId,
      totalSteps: template.steps.length,
      completedSteps: 0,
      status: 'ACTIVE',
    },
  })

  // Schedule all messages (email, SMS, WhatsApp)
  const enrollmentDate = new Date()
  const scheduledEmails = template.steps.map((step) => {
    const scheduledAt = new Date(enrollmentDate)
    scheduledAt.setDate(scheduledAt.getDate() + step.dayNumber)
    
    // Schedule timing based on channel
    if (step.channel === 'email') {
      scheduledAt.setHours(10, 0, 0, 0) // 10 AM for emails
    } else if (step.channel === 'sms' || step.channel === 'whatsapp') {
      scheduledAt.setHours(11, 0, 0, 0) // 11 AM for SMS/WhatsApp
    }

    return {
      contactId,
      tenantId,
      templateId: step.id, // Store step ID for reference
      channel: step.channel || 'email',
      subject: step.subject || null,
      body: step.body,
      scheduledAt,
      status: 'PENDING',
      retryCount: 0,
    }
  })

  await prisma.scheduledEmail.createMany({
    data: scheduledEmails,
  })

  return enrollment
}

/**
 * Get next scheduled email for a contact
 */
export async function getNextScheduledEmail(contactId: string) {
  return prisma.scheduledEmail.findFirst({
    where: {
      contactId,
      status: 'PENDING',
      scheduledAt: {
        lte: new Date(),
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  })
}

/**
 * Mark email as sent and update enrollment progress
 */
export async function markEmailSent(emailId: string) {
  const email = await prisma.scheduledEmail.findUnique({
    where: { id: emailId },
    include: {
      contact: {
        include: {
          nurtureEnrollments: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      },
    },
  })

  if (!email) {
    throw new Error('Email not found')
  }

  // Update email status
  await prisma.scheduledEmail.update({
    where: { id: emailId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  })

  // Update enrollment progress
  for (const enrollment of email.contact.nurtureEnrollments) {
    const sentEmailsCount = await prisma.scheduledEmail.count({
      where: {
        contactId: email.contactId,
        status: 'SENT',
        tenantId: email.tenantId,
      },
    })

    const newCompletedSteps = Math.min(sentEmailsCount, enrollment.totalSteps)
    const newStatus =
      newCompletedSteps >= enrollment.totalSteps ? 'COMPLETED' : enrollment.status

    await prisma.nurtureEnrollment.update({
      where: { id: enrollment.id },
      data: {
        completedSteps: newCompletedSteps,
        status: newStatus,
      },
    })
  }
}

/**
 * Mark email as failed and increment retry count
 */
export async function markEmailFailed(emailId: string) {
  const email = await prisma.scheduledEmail.findUnique({
    where: { id: emailId },
  })

  if (!email) {
    throw new Error('Email not found')
  }

  const maxRetries = 3
  const newRetryCount = email.retryCount + 1
  const newStatus = newRetryCount >= maxRetries ? 'FAILED' : 'PENDING'

  // Reschedule for retry (1 hour later)
  const newScheduledAt = new Date()
  newScheduledAt.setHours(newScheduledAt.getHours() + 1)

  await prisma.scheduledEmail.update({
    where: { id: emailId },
    data: {
      status: newStatus,
      retryCount: newRetryCount,
      scheduledAt: newStatus === 'PENDING' ? newScheduledAt : email.scheduledAt,
    },
  })
}
