/**
 * Shared CRM writeback for Voice Agents (browser-live + telephony).
 * Blueprint: matched contact → Interaction; unmatched → Voice Lead (Unverified).
 */

import type { PrismaClient } from '@prisma/client'
import {
  buildVoiceLeadUnverifiedContactData,
  type VoiceLeadSourceChannel,
} from '@/lib/voice-agent/crm-voice-lead'
import { normalizePhone } from '@/lib/voice-agent/browser-live/transcript-routing'

export type CrmWritebackResult = {
  contactId: string
  interactionId?: string
  leadCreated: boolean
  voiceLeadUnverified: boolean
  matchedExisting: boolean
}

export async function findContactIdByPhone(
  prisma: PrismaClient,
  tenantId: string,
  callerPhone?: string | null,
): Promise<string | null> {
  const normalized = normalizePhone(callerPhone)
  if (normalized.length < 10) return null

  const contacts = await prisma.contact.findMany({
    where: { tenantId, phone: { not: null } },
    select: { id: true, phone: true },
    take: 500,
  })
  const hit = contacts.find((c) => c.phone && normalizePhone(c.phone) === normalized)
  return hit?.id ?? null
}

export async function writeMatchedContactCallActivity(input: {
  prisma: PrismaClient
  contactId: string
  subject: string
  notes: string
  durationSeconds?: number
}): Promise<{ contactId: string; interactionId: string }> {
  const interaction = await input.prisma.interaction.create({
    data: {
      type: 'voice_call',
      subject: input.subject.slice(0, 200),
      notes: input.notes.slice(0, 2000),
      duration: input.durationSeconds,
      contactId: input.contactId,
    },
  })
  return { contactId: input.contactId, interactionId: interaction.id }
}

export async function writeVoiceLeadUnverified(input: {
  prisma: PrismaClient
  tenantId: string
  phone: string
  displayPhone?: string | null
  nameIfCaptured?: string | null
  agentId?: string
  sessionId?: string
  callId?: string
  channel: VoiceLeadSourceChannel
  language?: string | null
  disposition?: string
  summary?: string
  interactionSubject: string
  interactionNotes: string
  durationSeconds?: number
}): Promise<CrmWritebackResult> {
  const contactData = buildVoiceLeadUnverifiedContactData({
    tenantId: input.tenantId,
    phone: input.phone,
    displayPhone: input.displayPhone,
    nameIfCaptured: input.nameIfCaptured,
    agentId: input.agentId,
    sessionId: input.sessionId,
    callId: input.callId,
    channel: input.channel,
    language: input.language,
    disposition: input.disposition,
    summary: input.summary,
  })

  const created = await input.prisma.contact.create({ data: contactData })
  const interaction = await input.prisma.interaction.create({
    data: {
      type: 'voice_call',
      subject: input.interactionSubject.slice(0, 200),
      notes: input.interactionNotes.slice(0, 2000),
      duration: input.durationSeconds,
      contactId: created.id,
    },
  })

  return {
    contactId: created.id,
    interactionId: interaction.id,
    leadCreated: true,
    voiceLeadUnverified: true,
    matchedExisting: false,
  }
}

/** Best-effort caller name from first user transcript line. */
export function nameHintFromTranscript(
  turns: Array<{ role: string; content: string }>,
): string | null {
  const firstUser = turns.find((t) => t.role === 'user')?.content?.trim()
  if (!firstUser || firstUser.length < 3) return null
  const intro = firstUser.match(
    /(?:my name is|i am|i'm|this is)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i,
  )
  if (intro?.[1]) return intro[1].trim().slice(0, 80)
  return null
}
