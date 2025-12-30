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

  try {
    const { getSendGridClient } = await import('@/lib/email/sendgrid')
    const sendGrid = getSendGridClient()

    await sendGrid.sendEmail({
      to: email.contact.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@payaid.com',
      subject: email.subject || 'Message from PayAid',
      html: email.body || email.htmlContent || '',
      text: email.textContent || email.body?.replace(/<[^>]*>/g, '') || '',
    })

    console.log(`✅ Email sent to ${email.contact.email}: ${email.subject}`)
  } catch (error) {
    console.error(`❌ Failed to send email to ${email.contact.email}:`, error)
    throw error
  }
}

/**
 * Send SMS via Twilio/Exotel
 */
async function sendSMS(email: any) {
  if (!email.contact.phone) {
    throw new Error('Contact phone not found')
  }

  try {
    const message = email.body || email.textContent || ''
    
    // Try Twilio first, fallback to Exotel
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const { getTwilioClient } = await import('@/lib/marketing/twilio')
      const twilio = getTwilioClient()
      await twilio.sendSMS(email.contact.phone, message)
      console.log(`✅ SMS sent via Twilio to ${email.contact.phone}`)
    } else if (process.env.EXOTEL_API_KEY) {
      const { getExotelClient } = await import('@/lib/marketing/exotel')
      const exotel = getExotelClient()
      await exotel.sendSMS(email.contact.phone, message)
      console.log(`✅ SMS sent via Exotel to ${email.contact.phone}`)
    } else {
      throw new Error('No SMS provider configured (Twilio or Exotel)')
    }
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${email.contact.phone}:`, error)
    throw error
  }
}

/**
 * Send WhatsApp via WATI/WhatsApp Business API
 */
async function sendWhatsApp(email: any) {
  if (!email.contact.phone) {
    throw new Error('Contact phone not found')
  }

  try {
    if (process.env.WATI_API_KEY) {
      const { getWATIClient } = await import('@/lib/marketing/wati')
      const wati = getWATIClient()
      
      // WATI requires template-based messages, so we'll use a simple template
      // In production, you should create proper templates in WATI
      await wati.sendMessage({
        to: email.contact.phone,
        templateName: 'simple_message', // Replace with your actual template name
        bodyParameters: [email.body || email.textContent || ''],
      })
      console.log(`✅ WhatsApp sent via WATI to ${email.contact.phone}`)
    } else {
      throw new Error('WATI API not configured')
    }
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp to ${email.contact.phone}:`, error)
    throw error
  }
}
