/**
 * Voice ↔ CRM link records (blueprint CRMLink entity).
 */
import type { Prisma, PrismaClient } from '@prisma/client'

export type VoiceCrmEntityType = 'contact' | 'interaction' | 'lead' | 'case' | 'invoice' | 'deal'
export type VoiceCrmCreateMode = 'matched' | 'created' | 'inbox_only' | 'bundle_ref'

export type VoiceCrmLinkInput = {
  tenantId: string
  voiceSessionId?: string | null
  voiceCallId?: string | null
  entityType: VoiceCrmEntityType
  entityId: string
  matchConfidence?: number
  createMode: VoiceCrmCreateMode
  syncStatus?: 'linked' | 'pending' | 'failed'
  metadata?: Record<string, unknown>
}

function toJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (!value) return undefined
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export async function createVoiceCrmLink(
  prisma: PrismaClient,
  input: VoiceCrmLinkInput,
): Promise<string | null> {
  try {
    const row = await prisma.voiceCrmLink.create({
      data: {
        tenantId: input.tenantId,
        voiceSessionId: input.voiceSessionId || null,
        voiceCallId: input.voiceCallId || null,
        entityType: input.entityType,
        entityId: input.entityId,
        matchConfidence: input.matchConfidence ?? 1,
        createMode: input.createMode,
        syncStatus: input.syncStatus ?? 'linked',
        metadataJson: toJson(input.metadata),
      },
      select: { id: true },
    })
    return row.id
  } catch (error) {
    console.warn('[voice-crm-link] create failed:', error)
    return null
  }
}

export async function linkVoiceSessionCrmOutcome(
  prisma: PrismaClient,
  input: {
    tenantId: string
    voiceSessionId: string
    routing: string
    contactId?: string | null
    interactionId?: string | null
    leadCreated?: boolean
    invoiceId?: string | null
    dealId?: string | null
    caseId?: string | null
  },
): Promise<string[]> {
  const ids: string[] = []
  const base = {
    tenantId: input.tenantId,
    voiceSessionId: input.voiceSessionId,
  }

  if (input.contactId) {
    const mode: VoiceCrmCreateMode =
      input.routing === 'matched_contact' ? 'matched' : input.leadCreated ? 'created' : 'bundle_ref'
    const id = await createVoiceCrmLink(prisma, {
      ...base,
      entityType: input.leadCreated ? 'lead' : 'contact',
      entityId: input.contactId,
      createMode: mode,
      matchConfidence: input.routing === 'matched_contact' ? 1 : 0.6,
    })
    if (id) ids.push(id)
  }

  if (input.interactionId) {
    const id = await createVoiceCrmLink(prisma, {
      ...base,
      entityType: 'interaction',
      entityId: input.interactionId,
      createMode: input.routing === 'no_crm_inbox' ? 'inbox_only' : 'bundle_ref',
    })
    if (id) ids.push(id)
  }

  if (input.invoiceId) {
    const id = await createVoiceCrmLink(prisma, {
      ...base,
      entityType: 'invoice',
      entityId: input.invoiceId,
      createMode: 'bundle_ref',
      metadata: { bundle: 'finance_collections' },
    })
    if (id) ids.push(id)
  }

  if (input.dealId) {
    const id = await createVoiceCrmLink(prisma, {
      ...base,
      entityType: 'deal',
      entityId: input.dealId,
      createMode: 'bundle_ref',
      metadata: { bundle: 'crm' },
    })
    if (id) ids.push(id)
  }

  if (input.caseId) {
    const id = await createVoiceCrmLink(prisma, {
      ...base,
      entityType: 'case',
      entityId: input.caseId,
      createMode: 'bundle_ref',
      metadata: { bundle: 'support' },
    })
    if (id) ids.push(id)
  }

  if (input.routing === 'no_crm_inbox' && ids.length === 0) {
    const id = await createVoiceCrmLink(prisma, {
      ...base,
      entityType: 'lead',
      entityId: input.voiceSessionId,
      createMode: 'inbox_only',
      matchConfidence: 0,
      metadata: { inboxOnly: true },
    })
    if (id) ids.push(id)
  }

  return ids
}

export async function loadVoiceCrmLinks(
  prisma: PrismaClient,
  input: { tenantId: string; voiceSessionId?: string; voiceCallId?: string; limit?: number },
) {
  return prisma.voiceCrmLink.findMany({
    where: {
      tenantId: input.tenantId,
      ...(input.voiceSessionId ? { voiceSessionId: input.voiceSessionId } : {}),
      ...(input.voiceCallId ? { voiceCallId: input.voiceCallId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(input.limit ?? 50, 200),
  })
}
