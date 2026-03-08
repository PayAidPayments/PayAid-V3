/**
 * Sync voice call to CRM on call end: find/create Contact, log Interaction, optionally create Deal.
 */

import { prisma } from '@/lib/db/prisma'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

export async function syncVoiceCallToCrm(callSid: string): Promise<void> {
  const call = await prisma.voiceAgentCall.findFirst({
    where: { callSid },
    include: { agent: true },
  })
  if (!call || !call.from) return

  const tenantId = call.tenantId
  const phone = normalizePhone(call.from)
  if (phone.length < 10) return

  const workflow = call.agent?.workflow as { crm?: { autoCreateDeal?: boolean; logActivity?: boolean } } | null
  const crm = workflow?.crm
  const doLogActivity = crm?.logActivity !== false
  const doCreateDeal = crm?.autoCreateDeal === true

  const contacts = await prisma.contact.findMany({
    where: { tenantId, phone: { not: null } },
    select: { id: true, name: true, phone: true },
  })
  let contact = contacts.find((c) => c.phone && normalizePhone(c.phone) === phone) ?? null

  if (!contact) {
    const created = await prisma.contact.create({
      data: {
        tenantId,
        name: `Caller ${phone}`,
        phone: call.from,
        stage: 'prospect',
        source: 'voice_agent',
        sourceId: call.agentId,
      },
    })
    contact = created
  }

  if (doLogActivity) {
    const notes = call.transcript
      ? `Voice agent call. Transcript (last exchange): ${String(call.transcript).slice(0, 500)}`
      : `Voice agent call. Duration: ${call.durationSeconds ?? 0}s.`
    await prisma.interaction.create({
      data: {
        type: 'voice_call',
        subject: `Voice: ${call.agent?.name ?? 'Agent'}`,
        notes,
        duration: call.durationSeconds ?? undefined,
        contactId: contact.id,
      },
    })
  }

  if (doCreateDeal && contact) {
    await prisma.deal.create({
      data: {
        tenantId,
        name: `Voice: ${contact.name}`,
        value: 0,
        probability: 50,
        stage: 'lead',
        contactId: contact.id,
      },
    })
  }
}
