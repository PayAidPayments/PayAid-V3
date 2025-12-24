/**
 * Background job to send scheduled emails
 * Runs every 15 minutes to process pending emails
 */

import { prisma } from '@/lib/db/prisma'
import {
  getNextScheduledEmail,
  markEmailSent,
  markEmailFailed,
} from '@/lib/marketing/nurture-sequences'

/**
 * Process and send all pending scheduled emails
 */
export async function processScheduledEmails(tenantId?: string) {
  const where: any = {
    status: 'PENDING',
    scheduledAt: {
      lte: new Date(),
    },
  }

  if (tenantId) {
    where.tenantId = tenantId
  }

  // Get all pending emails ready to send
  const pendingEmails = await prisma.scheduledEmail.findMany({
    where,
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: 100, // Process in batches
  })

  console.log(`Processing ${pendingEmails.length} scheduled emails...`)

  let successCount = 0
  let failureCount = 0

  for (const email of pendingEmails) {
    try {
      // TODO: Integrate with SendGrid or your email service
      // For now, we'll simulate sending
      await sendEmailViaService(email)

      // Mark as sent
      await markEmailSent(email.id)
      successCount++

      console.log(`✅ Sent email to ${email.contact.email}: ${email.subject}`)
    } catch (error) {
      console.error(
        `❌ Failed to send email to ${email.contact.email}:`,
        error
      )
      await markEmailFailed(email.id)
      failureCount++
    }
  }

  console.log(
    `Email processing complete: ${successCount} sent, ${failureCount} failed`
  )

  return {
    total: pendingEmails.length,
    success: successCount,
    failures: failureCount,
  }
}

/**
 * Send message via appropriate channel (Email, SMS, WhatsApp)
 */
async function sendEmailViaService(email: any) {
  const channel = email.channel || 'email'

  switch (channel) {
    case 'email':
      await sendEmail(email)
      break
    case 'sms':
      await sendSMS(email)
      break
    case 'whatsapp':
      await sendWhatsApp(email)
      break
    default:
      throw new Error(`Unsupported channel: ${channel}`)
  }
}

/**
 * Send email via SendGrid
 */
async function sendEmail(email: any) {
  if (!email.contact.email) {
    throw new Error('Contact email not found')
  }

  // TODO: Integrate with SendGrid
  // const sgMail = require('@sendgrid/mail')
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  // await sgMail.send({
  //   to: email.contact.email,
  //   from: process.env.SENDGRID_FROM_EMAIL,
  //   subject: email.subject || 'Message from PayAid',
  //   html: email.body,
  // })

  // Simulate for now
  console.log(`📧 Email to ${email.contact.email}: ${email.subject}`)
  await new Promise((resolve) => setTimeout(resolve, 100))
}

/**
 * Send SMS via Twilio/Exotel
 */
async function sendSMS(email: any) {
  if (!email.contact.phone) {
    throw new Error('Contact phone not found')
  }

  // TODO: Integrate with Twilio or Exotel
  // await twilio.messages.create({
  //   to: email.contact.phone,
  //   from: process.env.TWILIO_PHONE,
  //   body: email.body,
  // })

  // Simulate for now
  console.log(`📱 SMS to ${email.contact.phone}: ${email.body.substring(0, 50)}...`)
  await new Promise((resolve) => setTimeout(resolve, 100))
}

/**
 * Send WhatsApp via WATI/WhatsApp Business API
 */
async function sendWhatsApp(email: any) {
  if (!email.contact.phone) {
    throw new Error('Contact phone not found')
  }

  // TODO: Integrate with WATI or WhatsApp Business API
  // await wati.sendMessage({
  //   to: email.contact.phone,
  //   message: email.body,
  // })

  // Simulate for now
  console.log(`💬 WhatsApp to ${email.contact.phone}: ${email.body.substring(0, 50)}...`)
  await new Promise((resolve) => setTimeout(resolve, 100))
}
