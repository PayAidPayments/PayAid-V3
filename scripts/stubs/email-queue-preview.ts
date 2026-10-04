/** Preview stub — no bull import. */

function noopQueue() {
  const queue = {
    add: async () => null,
    process: () => undefined,
    close: async () => undefined,
    on() {
      return queue
    },
  }
  return queue
}

export type EmailSyncJobData = {
  accountId: string
  tenantId: string
  maxResults?: number
}

export type EmailSendJobData = {
  tenantId: string
  accountId?: string
  fromEmail: string
  toEmails: string[]
  ccEmails?: string[]
  bccEmails?: string[]
  subject: string
  htmlBody?: string
  textBody?: string
  contactId?: string
  campaignId?: string
  dealId?: string
  trackingId?: string
  replyToMessageId?: string
}

export type EmailCampaignDispatchJobData = {
  campaignId: string
  tenantId: string
  batchSize?: number
  dryRun?: boolean
}

export const emailSyncQueue = noopQueue()
export const emailSendQueue = noopQueue()
export const emailCampaignQueue = noopQueue()

export async function addEmailSyncJob(_data: EmailSyncJobData, _options?: unknown) {
  return null
}

export async function addEmailSendJob(_data: EmailSendJobData, _options?: unknown) {
  return null
}

export async function addEmailCampaignDispatchJob(
  _data: EmailCampaignDispatchJobData,
  _options?: unknown
) {
  return null
}

export async function closeEmailQueues() {
  await emailSyncQueue.close()
  await emailSendQueue.close()
  await emailCampaignQueue.close()
}
