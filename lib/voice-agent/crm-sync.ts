/**
 * Sync voice call to CRM on call end: find/create Contact, log Interaction, optionally create Deal.
 */

import { prisma } from '@/lib/db/prisma'
import {
  findContactIdByPhone,
  writeMatchedContactCallActivity,
  writeVoiceLeadUnverified,
} from '@/lib/voice-agent/crm-writeback'
import { emitVoiceEvent } from '@/lib/voice-agent/events/emit-voice-event'

export async function syncVoiceCallToCrm(callSid: string): Promise<void> {
  const call = await prisma.voiceAgentCall.findFirst({
    where: { callSid },
    include: { agent: true },
  })
  if (!call || !call.from) return

  const tenantId = call.tenantId
  const workflow = call.agent?.workflow as { crm?: { autoCreateDeal?: boolean; logActivity?: boolean } } | null
  const crm = workflow?.crm
  const doLogActivity = crm?.logActivity !== false
  const doCreateDeal = crm?.autoCreateDeal === true

  const matchedContactId = await findContactIdByPhone(prisma, tenantId, call.from)
  const notes = call.transcript
    ? `Voice agent call. Transcript (last exchange): ${String(call.transcript).slice(0, 500)}`
    : `Voice agent call. Duration: ${call.durationSeconds ?? 0}s.`

  let contactId: string

  if (matchedContactId) {
    contactId = matchedContactId
    if (doLogActivity) {
      await writeMatchedContactCallActivity({
        prisma,
        contactId,
        subject: `Voice: ${call.agent?.name ?? 'Agent'}`,
        notes,
        durationSeconds: call.durationSeconds ?? undefined,
      })
    }
  } else {
    const lead = await writeVoiceLeadUnverified({
      prisma,
      tenantId,
      phone: call.from.replace(/\D/g, '').slice(-10),
      displayPhone: call.from,
      agentId: call.agentId,
      callId: call.id,
      channel: 'telephony',
      language: call.languageUsed ?? call.agent?.language,
      summary: notes,
      interactionSubject: `Voice lead (unverified): ${call.agent?.name ?? 'Agent'}`,
      interactionNotes: notes,
      durationSeconds: call.durationSeconds ?? undefined,
    })
    contactId = lead.contactId

    await emitVoiceEvent('crm.match.failed', {
      tenantId,
      agentId: call.agentId,
      callId: call.id,
      meta: { action: 'voice_lead_unverified_created', callSid },
    })
  }

  if (doCreateDeal && contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId },
      select: { name: true },
    })
    await prisma.deal.create({
      data: {
        tenantId,
        name: `Voice: ${contact?.name ?? 'Caller'}`,
        value: 0,
        probability: 50,
        stage: 'lead',
        contactId,
      },
    })
  }

  await emitVoiceEvent('summary.ready', {
    tenantId,
    agentId: call.agentId,
    callId: call.id,
    meta: {
      disposition: call.status ?? 'completed',
      durationSeconds: call.durationSeconds,
    },
  })
}
