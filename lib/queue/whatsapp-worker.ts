/**
 * Phase 11: WhatsApp outbound worker – process whatsapp-outbound queue.
 * Run: npx tsx lib/queue/whatsapp-worker.ts (or from a worker process).
 * When Baileys is wired: call sendMessage(sock, to, text) here.
 */
import { whatsappOutboundQueue, type WhatsAppOutboundJobData } from './whatsapp-queue'

async function processSendJob(job: { id: string; data: WhatsAppOutboundJobData }) {
  const { to, text, template, tenantId, contactId } = job.data
  // TODO: get Baileys sock from session (Redis or file), then sendMessage(sock, to, text ?? template)
  // For now: log and complete so queue doesn't back up
  console.log('[whatsapp-worker] send', { to, text: text ?? template, tenantId, contactId })
  return { sent: false, reason: 'Baileys not wired' }
}

whatsappOutboundQueue.process('send', async (job) =>
  processSendJob({ id: String(job.id), data: job.data as WhatsAppOutboundJobData })
)

console.log('[whatsapp-worker] listening for whatsapp-outbound jobs')
