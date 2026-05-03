/**
 * Phase 11: WhatsApp outbound Bull queue.
 * Add jobs from CRM broadcast or automation; worker processes and sends via Baileys/Meta API.
 */
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
    return { host: parts[0] || 'localhost', port: parts[1] ? parseInt(parts[1], 10) : 6379 }
  }
}

const redisConfig = parseRedisUrl(getRedisConfig().url)

export const whatsappOutboundQueue = new Bull('whatsapp-outbound', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
})

export interface WhatsAppOutboundJobData {
  to: string // E.164
  template?: string
  text?: string
  tenantId: string
  contactId?: string
}

export async function addWhatsAppOutboundJob(data: WhatsAppOutboundJobData): Promise<Bull.Job | undefined> {
  return whatsappOutboundQueue.add('send', data)
}

whatsappOutboundQueue.on('failed', (job, err) => {
  console.error('[whatsapp-outbound] job failed:', job?.id, err?.message)
})
