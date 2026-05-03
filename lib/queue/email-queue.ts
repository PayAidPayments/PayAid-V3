import Bull from 'bull'
import { getRedisConfig } from '@/lib/config/env'

function parseRedisUrl(redisUrl: string): { host: string; port: number; password?: string } {
  try {
    const parsed = new URL(redisUrl)
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      password: parsed.password || undefined,
    }
  } catch {
    const parts = redisUrl.replace('redis://', '').split(':')
    return {
      host: parts[0] || 'localhost',
      port: parts[1] ? parseInt(parts[1], 10) : 6379,
    }
  }
}

function shouldEnableBull(): boolean {
  const config = getRedisConfig()
  const isBuildPhase = (process.env.NEXT_PHASE || '').includes('build')
  if (isBuildPhase) return false
  return config.tcpAvailable
}

type MinimalQueue = Pick<Bull.Queue, 'add' | 'on' | 'close' | 'process'>

function createNoopQueue(): MinimalQueue {
  return {
    add: async () => null as any,
    on: () => createNoopQueue() as any,
    process: () => undefined as any,
    close: async () => {},
  }
}

const redisConfig = parseRedisUrl(getRedisConfig().url)
const queueDefaults: Bull.JobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 200,
  removeOnFail: 500,
}

const emailSendQueueDefaults: Bull.JobOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 500,
  removeOnFail: 1000,
}

export interface EmailSyncJobData {
  accountId: string
  tenantId: string
  maxResults?: number
}

export interface EmailSendJobData {
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

export interface EmailCampaignDispatchJobData {
  campaignId: string
  tenantId: string
  batchSize?: number
  dryRun?: boolean
}

export const emailSyncQueue: MinimalQueue = shouldEnableBull()
  ? new Bull('email-sync', { redis: redisConfig, defaultJobOptions: queueDefaults })
  : createNoopQueue()

export const emailSendQueue: MinimalQueue = shouldEnableBull()
  ? new Bull('email-send', { redis: redisConfig, defaultJobOptions: emailSendQueueDefaults })
  : createNoopQueue()

export const emailCampaignQueue: MinimalQueue = shouldEnableBull()
  ? new Bull('email-campaign-dispatch', { redis: redisConfig, defaultJobOptions: queueDefaults })
  : createNoopQueue()

export async function addEmailSyncJob(data: EmailSyncJobData, options?: Bull.JobOptions) {
  return (emailSyncQueue as any).add('sync-account', data, options)
}

export async function addEmailSendJob(data: EmailSendJobData, options?: Bull.JobOptions) {
  return (emailSendQueue as any).add('send-email', data, options)
}

export async function addEmailCampaignDispatchJob(
  data: EmailCampaignDispatchJobData,
  options?: Bull.JobOptions
) {
  return (emailCampaignQueue as any).add('dispatch-campaign', data, options)
}

export async function closeEmailQueues() {
  await emailSyncQueue.close()
  await emailSendQueue.close()
  await emailCampaignQueue.close()
}
