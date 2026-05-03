/**
 * Multi-channel Lead Alert Notification System
 * Sends notifications via Email, SMS, and In-app when a lead is assigned
 */

import { prisma } from '@/lib/db/prisma'
import type { Contact, SalesRep } from '@prisma/client'

interface LeadAlertOptions {
  rep: SalesRep & { user: { name: string; email: string } }
  contact: Contact
  type: 'NEW_LEAD_ASSIGNED' | 'FOLLOW_UP_DUE' | 'HOT_LEAD'
  channels?: ('email' | 'sms' | 'in-app')[]
}

/**
 * Send lead alert notification via multiple channels
 */
export async function sendLeadAlert(options: LeadAlertOptions): Promise<void> {
  const { rep, contact, type, channels = ['email', 'sms', 'in-app'] } = options

  // Get lead score to determine urgency
  const leadScore = contact.leadScore || 0
  const isHot = leadScore >= 70

  // Prepare message based on type
  let title = ''
  let message = ''
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'

  switch (type) {
    case 'NEW_LEAD_ASSIGNED':
      title = isHot ? '🔥 Hot Lead Assigned!' : 'New Lead Assigned'
      message = `New lead assigned: ${contact.name}${contact.company ? ` from ${contact.company}` : ''}${isHot ? ' - HOT LEAD!' : ''}`
      priority = isHot ? 'HIGH' : 'MEDIUM'
      break
    case 'FOLLOW_UP_DUE':
      title = 'Follow-up Due'
      message = `${contact.name} follow-up due today`
      priority = 'MEDIUM'
      break
    case 'HOT_LEAD':
      title = '🔥 Hot Lead Alert!'
      message = `Hot lead! ${contact.name} ready to buy (Score: ${Math.round(leadScore)})`
      priority = 'HIGH'
      break
  }

  // Send via each channel
  const promises: Promise<void>[] = []

  if (channels.includes('email')) {
    promises.push(sendEmailAlert(rep, contact, title, message, priority))
  }

  if (channels.includes('sms')) {
    promises.push(sendSMSAlert(rep, contact, message, priority))
  }

  // Always save in-app notification
  promises.push(saveInAppNotification(rep, contact, type, title, message, priority))

  await Promise.allSettled(promises)
}

/**
 * Send email notification
 */
async function sendEmailAlert(
  rep: SalesRep & { user: { name: string; email: string } },
  contact: Contact,
  title: string,
  message: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
): Promise<void> {
  // TODO: Integrate with SendGrid or your email service
  // For now, log the email
  console.log(`📧 Email to ${rep.user.email}: ${title} - ${message}`)

  // Example SendGrid integration:
  // await sendGrid.send({
  //   to: rep.user.email,
  //   subject: title,
  //   html: generateEmailTemplate(rep, contact, message, priority)
  // })
}

/**
 * Send SMS notification
 */
async function sendSMSAlert(
  rep: SalesRep & { user: { name: string; email: string } },
  contact: Contact,
  message: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
): Promise<void> {
  // TODO: Integrate with Twilio, Exotel, or your SMS service
  // For now, log the SMS
  console.log(`📱 SMS to ${rep.user.name}: ${message}`)

  // Example Twilio integration:
  // await twilio.messages.create({
  //   to: rep.phone,
  //   from: process.env.TWILIO_PHONE,
  //   body: message
  // })
}

/**
 * Save in-app notification
 */
async function saveInAppNotification(
  rep: SalesRep & { user: { name: string; email: string } },
  contact: Contact,
  type: string,
  title: string,
  message: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
): Promise<void> {
  // Create alert record
  await prisma.alert.create({
    data: {
      repId: rep.id,
      tenantId: contact.tenantId,
      type,
      title,
      message,
      leadId: contact.id,
      channels: ['in-app'],
      priority,
    },
  })
}

/**
 * Generate email template HTML
 */
function generateEmailTemplate(
  rep: SalesRep & { user: { name: string; email: string } },
  contact: Contact,
  message: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
): string {
  const urgencyColor = priority === 'HIGH' ? '#dc2626' : priority === 'MEDIUM' ? '#f59e0b' : '#6b7280'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${message}</h1>
        </div>
        <div class="content">
          <p>Hi ${rep.user.name},</p>
          <p>A new lead has been assigned to you:</p>
          <ul>
            <li><strong>Name:</strong> ${contact.name}</li>
            ${contact.company ? `<li><strong>Company:</strong> ${contact.company}</li>` : ''}
            ${contact.email ? `<li><strong>Email:</strong> ${contact.email}</li>` : ''}
            ${contact.phone ? `<li><strong>Phone:</strong> ${contact.phone}</li>` : ''}
            ${contact.leadScore ? `<li><strong>Lead Score:</strong> ${Math.round(contact.leadScore)}/100</li>` : ''}
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/contacts/${contact.id}" class="button">
            View Lead Details
          </a>
        </div>
      </div>
    </body>
    </html>
  `
}
