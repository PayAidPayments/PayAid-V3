/**
 * Decision Notification System
 * Sends notifications for AI decisions via email, Slack, and in-app
 */

import { prisma } from '@/lib/db/prisma'
import { AIDecision } from '@prisma/client'

export interface NotificationChannels {
  email?: boolean
  slack?: boolean
  inApp?: boolean
}

export interface DecisionNotificationOptions {
  decision: AIDecision
  approvers: string[] // User IDs
  channels?: NotificationChannels
  customMessage?: string
}

/**
 * Send notification to approvers about pending decision
 */
export async function notifyApprovers(
  options: DecisionNotificationOptions
): Promise<void> {
  const { decision, approvers, channels = { email: true, inApp: true }, customMessage } = options

  // Get approver user details
  const users = await prisma.user.findMany({
    where: {
      id: { in: approvers },
      tenantId: decision.tenantId,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  const promises: Promise<void>[] = []

  for (const user of users) {
    if (channels.email) {
      promises.push(sendEmailApprovalNotification(decision, user, customMessage))
    }

    if (channels.slack) {
      promises.push(sendSlackApprovalNotification(decision, user, customMessage))
    }

    if (channels.inApp) {
      promises.push(createInAppNotification(decision, user.id, customMessage))
    }
  }

  await Promise.allSettled(promises)
}

/**
 * Send email approval notification with approval link
 */
async function sendEmailApprovalNotification(
  decision: AIDecision,
  user: { id: string; email: string; name: string | null },
  customMessage?: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const approvalToken = await generateApprovalToken(decision.id, user.id)
  const approvalUrl = `${baseUrl}/api/ai/decisions/${decision.id}/approve?token=${approvalToken}&action=approve`
  const rejectUrl = `${baseUrl}/api/ai/decisions/${decision.id}/approve?token=${approvalToken}&action=reject`

  const subject = `Action Required: Approve AI Decision - ${decision.type.replace(/_/g, ' ')}`
  const message = customMessage || `A new AI decision requires your approval.`

  // Email service integration (SendGrid, Resend, etc.)
  // For now, log the email. In production, integrate with your email service:
  console.log(`📧 Email to ${user.email}:`, {
    subject,
    message,
    approvalUrl,
    rejectUrl,
  })

  // Production email integration example:
  // try {
  //   const emailService = process.env.EMAIL_SERVICE // 'sendgrid' | 'resend' | 'ses'
  //   if (emailService === 'sendgrid') {
  //     await sendGrid.send({
  //       to: user.email,
  //       subject,
  //       html: generateEmailTemplate(decision, user, approvalUrl, rejectUrl, message)
  //     })
  //   } else if (emailService === 'resend') {
  //     await resend.emails.send({
  //       from: 'PayAid <noreply@payaid.com>',
  //       to: user.email,
  //       subject,
  //       html: generateEmailTemplate(decision, user, approvalUrl, rejectUrl, message)
  //     })
  //   }
  // } catch (error) {
  //   console.error('Failed to send email notification:', error)
  // }
}

/**
 * Send Slack notification
 */
async function sendSlackApprovalNotification(
  decision: AIDecision,
  user: { id: string; email: string; name: string | null },
  customMessage?: string
): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!slackWebhookUrl) {
    console.warn('Slack webhook URL not configured')
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const approvalToken = await generateApprovalToken(decision.id, user.id)
  const approvalUrl = `${baseUrl}/api/ai/decisions/${decision.id}/approve?token=${approvalToken}&action=approve`

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔔 AI Decision Approval Required`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${user.name || 'User'}*, you have a pending AI decision approval:\n\n*Type:* ${decision.type.replace(/_/g, ' ')}\n*Risk Score:* ${decision.riskScore}/100\n*Description:* ${decision.description}\n\n${customMessage || ''}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '✅ Approve' },
                style: 'primary',
                url: approvalUrl,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '❌ Reject' },
                style: 'danger',
                url: approvalUrl.replace('action=approve', 'action=reject'),
              },
            ],
          },
        ],
      }),
    })
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}

/**
 * Create in-app notification
 */
async function createInAppNotification(
  decision: AIDecision,
  userId: string,
  customMessage?: string
): Promise<void> {
  try {
    // Use existing Alert model or create a new Notification model
    await prisma.alert.create({
      data: {
        tenantId: decision.tenantId,
        repId: userId, // Using repId field for userId
        type: 'AI_DECISION_APPROVAL_REQUIRED',
        title: `AI Decision Approval Required: ${decision.type.replace(/_/g, ' ')}`,
        message: customMessage || decision.description,
        priority: decision.riskScore >= 70 ? 'HIGH' : decision.riskScore >= 40 ? 'MEDIUM' : 'LOW',
        channels: ['in-app'],
      },
    })
  } catch (error) {
    console.error('Failed to create in-app notification:', error)
    // Fallback: Try to use a different notification mechanism
  }
}

/**
 * Generate secure approval token
 */
async function generateApprovalToken(decisionId: string, userId: string): Promise<string> {
  // In production, use a secure token generation library (e.g., jose, jsonwebtoken)
  // For now, create a simple token that expires in 24 hours
  const payload = {
    decisionId,
    userId,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  // Store token in database for validation
  const token = Buffer.from(JSON.stringify(payload)).toString('base64')

  await prisma.approvalToken.create({
    data: {
      decisionId,
      userId,
      token,
      expiresAt: new Date(payload.expiresAt),
    },
  })

  return token
}

/**
 * Validate approval token
 */
export async function validateApprovalToken(
  token: string,
  decisionId: string
): Promise<{ valid: boolean; userId?: string }> {
  try {
    const stored = await prisma.approvalToken.findFirst({
      where: {
        token,
        decisionId,
        expiresAt: { gt: new Date() },
      },
    })

    if (!stored) {
      return { valid: false }
    }

    return { valid: true, userId: stored.userId }
  } catch (error) {
    console.error('Failed to validate approval token:', error)
    return { valid: false }
  }
}

/**
 * Notify decision execution result
 */
export async function notifyDecisionExecution(
  decision: AIDecision,
  success: boolean,
  message?: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: decision.requestedBy },
    select: { email: true, name: true },
  })

  if (!user) return

  const subject = success
    ? `✅ AI Decision Executed: ${decision.type.replace(/_/g, ' ')}`
    : `❌ AI Decision Failed: ${decision.type.replace(/_/g, ' ')}`

  // Send email notification about execution result
  console.log(`📧 Execution notification to ${user.email}:`, {
    subject,
    message: message || decision.description,
  })

  // Production email integration:
  // try {
  //   const emailService = process.env.EMAIL_SERVICE
  //   if (emailService === 'sendgrid' || emailService === 'resend') {
  //     await sendEmail({
  //       to: user.email,
  //       subject,
  //       html: generateExecutionEmailTemplate(decision, success, message)
  //     })
  //   }
  // } catch (error) {
  //   console.error('Failed to send execution notification:', error)
  // }
}
