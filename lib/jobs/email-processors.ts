import type Bull from 'bull'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import {
  emailCampaignQueue,
  emailSendQueue,
  emailSyncQueue,
  type EmailCampaignDispatchJobData,
  type EmailSendJobData,
  type EmailSyncJobData,
} from '@/lib/queue/email-queue'
import { sendGmailEmail } from '@/lib/email/gmail'
import { logOutboundEmail, syncEmailInbox } from '@/lib/email/sync-service'

type QueueJob<T> = Bull.Job<T>

async function recomputeCampaignProgress(tenantId: string, campaignId: string) {
  const grouped = await prisma.emailSendJob.groupBy({
    by: ['status'],
    where: {
      tenantId,
      campaignId,
    },
    _count: {
      _all: true,
    },
  })

  const counts = grouped.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all
      return acc
    },
    {} as Record<string, number>
  )

  const pending = counts.pending ?? 0
  const processing = counts.processing ?? 0
  const sent = counts.sent ?? 0
  const failed = counts.failed ?? 0
  const deadLetter = counts.dead_letter ?? 0
  const total = pending + processing + sent + failed + deadLetter

  let status = 'sending'
  if (total > 0 && pending + processing === 0) {
    status = sent > 0 ? 'sent' : 'failed'
  }

  await prisma.campaign.updateMany({
    where: {
      id: campaignId,
      tenantId,
      type: 'email',
    },
    data: {
      status,
      recipientCount: total,
      sent,
      delivered: sent,
      bounced: failed + deadLetter,
      sentAt: status === 'sent' ? new Date() : null,
    },
  })

  return {
    total,
    pending,
    processing,
    sent,
    failed,
    deadLetter,
    status,
  }
}

async function markSendJobStatus(
  trackingId: string | undefined,
  status: 'processing' | 'sent' | 'failed' | 'dead_letter',
  error?: string
) {
  if (!trackingId) return

  const affectedJobs = await prisma.emailSendJob.findMany({
    where: {
      OR: [{ id: trackingId }, { trackingId }],
    },
    select: {
      id: true,
      tenantId: true,
      campaignId: true,
    },
  })

  await prisma.emailSendJob.updateMany({
    where: {
      OR: [{ id: trackingId }, { trackingId }],
    },
    data: {
      status,
      error,
      attempts: status === 'failed' || status === 'dead_letter' ? { increment: 1 } : undefined,
      sentAt: status === 'sent' ? new Date() : undefined,
    },
  })

  const touchedCampaigns = new Map<string, string>()
  for (const job of affectedJobs) {
    if (job.campaignId) {
      touchedCampaigns.set(job.campaignId, job.tenantId)
    }
  }

  for (const [campaignId, tenantId] of touchedCampaigns.entries()) {
    await recomputeCampaignProgress(tenantId, campaignId)
  }
}

async function processEmailSendJob(job: QueueJob<EmailSendJobData>) {
  const data = job.data
  const to = data.toEmails[0]

  if (!to) {
    throw new Error('send-email job missing recipient')
  }

  await markSendJobStatus(data.trackingId, 'processing')

  const account = data.accountId
    ? await prisma.emailAccount.findUnique({
        where: { id: data.accountId },
        select: { id: true, provider: true },
      })
    : null

  try {
    if (account?.provider === 'gmail') {
      await sendGmailEmail(
        account.id,
        to,
        data.subject,
        data.htmlBody || data.textBody || '',
        {
          cc: data.ccEmails?.join(',') || undefined,
          bcc: data.bccEmails?.join(',') || undefined,
        }
      )
    } else if (data.accountId) {
      // For non-Gmail providers we persist outbound activity first.
      await logOutboundEmail(data.accountId, to, data.subject, data.textBody || data.htmlBody || '', {
        cc: data.ccEmails?.[0],
        bcc: data.bccEmails?.[0],
        contactId: data.contactId,
        dealId: data.dealId,
        htmlBody: data.htmlBody,
      })
    } else {
      // No account selected yet; keep this as a controllable failure.
      throw new Error('No sending account configured for email job')
    }

    await markSendJobStatus(data.trackingId, 'sent')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown send error'
    const maxAttempts =
      typeof job.opts.attempts === 'number' ? job.opts.attempts : Number(process.env.EMAIL_SEND_MAX_ATTEMPTS || 5)
    const nextAttempt = (job.attemptsMade || 0) + 1
    const shouldDeadLetter = nextAttempt >= maxAttempts

    await markSendJobStatus(data.trackingId, shouldDeadLetter ? 'dead_letter' : 'failed', message)

    if (shouldDeadLetter) {
      return {
        success: false,
        deadLettered: true,
        reason: message,
      }
    }

    throw error
  }
}

function extractDomain(email: string): string {
  const trimmed = email.trim().toLowerCase()
  const idx = trimmed.lastIndexOf('@')
  return idx === -1 ? '' : trimmed.slice(idx + 1)
}

function pickSenderAccountForRecipient(
  recipientEmail: string,
  senderAccounts: Array<{ id: string; email: string }>,
  dailyUsageBySenderId: Record<string, number>,
  preferredSenderDomain?: string
) {
  if (senderAccounts.length === 0) {
    return null
  }

  const normalizedPreferredDomain = (preferredSenderDomain || '').trim().toLowerCase()
  const recipientDomain = extractDomain(recipientEmail)

  const scored = senderAccounts.map((account) => {
    const senderDomain = extractDomain(account.email)
    const usageScore = dailyUsageBySenderId[account.id] ?? 0
    const preferredMatch = normalizedPreferredDomain && senderDomain === normalizedPreferredDomain ? 1 : 0
    const recipientDomainMatch = recipientDomain && senderDomain === recipientDomain ? 1 : 0
    return {
      account,
      preferredMatch,
      recipientDomainMatch,
      usageScore,
    }
  })

  scored.sort((a, b) => {
    if (a.preferredMatch !== b.preferredMatch) return b.preferredMatch - a.preferredMatch
    if (a.recipientDomainMatch !== b.recipientDomainMatch) return b.recipientDomainMatch - a.recipientDomainMatch
    if (a.usageScore !== b.usageScore) return a.usageScore - b.usageScore
    return a.account.email.localeCompare(b.account.email)
  })

  return scored[0]?.account ?? null
}

async function processEmailSyncJob(job: QueueJob<EmailSyncJobData>) {
  const { accountId, maxResults } = job.data
  const result = await syncEmailInbox(accountId, maxResults ?? 50)

  await prisma.emailSyncCheckpoint.upsert({
    where: { accountId },
    create: {
      accountId,
      provider: 'generic',
      lastSyncAt: new Date(),
      syncCursor: {
        synced: result.synced,
        linked: result.linked,
        created: result.created,
        errors: result.errors,
      },
    },
    update: {
      lastSyncAt: new Date(),
      syncCursor: {
        synced: result.synced,
        linked: result.linked,
        created: result.created,
        errors: result.errors,
      },
    },
  })

  return result
}

async function processEmailCampaignDispatchJob(job: QueueJob<EmailCampaignDispatchJobData>) {
  const { campaignId, tenantId } = job.data
  const batchSize = Math.max(1, job.data.batchSize ?? 100)
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, tenantId, type: 'email' },
    select: { id: true, status: true, contactIds: true, subject: true, content: true },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const existingJobs = await prisma.emailSendJob.count({
    where: {
      tenantId,
      campaignId: campaign.id,
      status: { in: ['pending', 'processing', 'sent'] },
    },
  })

  if (existingJobs > 0) {
    return { queuedContacts: existingJobs, skipped: true, success: true }
  }

  const contacts = await prisma.contact.findMany({
    where: {
      tenantId,
      id: { in: campaign.contactIds },
      status: 'active',
      email: { not: null },
    },
    select: { id: true, email: true, name: true },
    take: batchSize,
  })

  if (contacts.length === 0) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'failed',
      },
    })
    return { queuedContacts: 0, success: false, reason: 'No eligible contacts with email' }
  }

  const senderAccount = await prisma.emailAccount.findFirst({
    where: {
      tenantId,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  })

  if (!senderAccount) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'failed' },
    })
    throw new Error('No active email sender account available for campaign dispatch')
  }

  const senderPolicy = await prisma.emailCampaignSenderPolicy.findFirst({
    where: {
      tenantId,
      campaignId: campaign.id,
    },
    select: {
      senderAccountId: true,
      senderDomain: true,
    },
  })

  const senderAccounts = await prisma.emailAccount.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(senderPolicy?.senderAccountId
        ? {
            id: senderPolicy.senderAccountId,
          }
        : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  })

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const todaysUsage = await prisma.emailSendJob.groupBy({
    by: ['accountId'],
    where: {
      tenantId,
      createdAt: {
        gte: dayStart,
      },
      accountId: {
        not: null,
      },
    },
    _count: {
      _all: true,
    },
  })

  const usageBySenderId = todaysUsage.reduce(
    (acc, row) => {
      if (row.accountId) {
        acc[row.accountId] = row._count._all
      }
      return acc
    },
    {} as Record<string, number>
  )

  const sendsPerMinute = Math.max(10, Number(process.env.EMAIL_CAMPAIGN_SENDS_PER_MINUTE || 60))
  const sendSpacingMs = Math.floor(60000 / sendsPerMinute)
  const preferredSenderDomain = senderPolicy?.senderDomain || process.env.EMAIL_DEFAULT_SENDER_DOMAIN

  let queuedCount = 0
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]
    const recipientEmail = (contact.email || '').trim()
    if (!recipientEmail) continue
    const selectedSender =
      pickSenderAccountForRecipient(recipientEmail, senderAccounts, usageBySenderId, preferredSenderDomain) ||
      senderAccount

    const trackingId = randomUUID()
    const sendJob = await prisma.emailSendJob.create({
      data: {
        tenantId,
        accountId: selectedSender.id,
        fromEmail: selectedSender.email,
        toEmails: [recipientEmail],
        ccEmails: [],
        bccEmails: [],
        subject: campaign.subject || '',
        htmlBody: campaign.content,
        textBody: campaign.content.replace(/<[^>]+>/g, ' ').trim(),
        campaignId: campaign.id,
        contactId: contact.id,
        trackingId,
        eventType: 'campaign',
        status: 'pending',
      },
      select: { id: true },
    })

    await emailSendQueue.add(
      'send-email',
      {
        tenantId,
        accountId: selectedSender.id,
        fromEmail: selectedSender.email,
        toEmails: [recipientEmail],
        subject: campaign.subject || '',
        htmlBody: campaign.content,
        textBody: campaign.content.replace(/<[^>]+>/g, ' ').trim(),
        campaignId: campaign.id,
        contactId: contact.id,
        trackingId,
      },
      {
        jobId: `email-campaign-${campaign.id}-${sendJob.id}`,
        delay: i * sendSpacingMs,
      }
    )
    usageBySenderId[selectedSender.id] = (usageBySenderId[selectedSender.id] ?? 0) + 1
    queuedCount++
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: queuedCount > 0 ? 'sending' : 'failed',
      recipientCount: contacts.length,
    },
  })

  if (queuedCount > 0) {
    await recomputeCampaignProgress(tenantId, campaign.id)
  }

  return { queuedContacts: queuedCount, success: queuedCount > 0 }
}

export function setupEmailWorkflowProcessors() {
  emailSendQueue.process('send-email', processEmailSendJob)
  emailSyncQueue.process('sync-account', processEmailSyncJob)
  emailCampaignQueue.process('dispatch-campaign', processEmailCampaignDispatchJob)
}
