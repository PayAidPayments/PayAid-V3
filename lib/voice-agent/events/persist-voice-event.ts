/**
 * Persist voice events to VoiceDemoSession.metadataJson (Phase 2).
 * Dedicated VoiceEvent table deferred until telephony bus consumers ship.
 */

import type { Prisma, PrismaClient } from '@prisma/client'
import type { VoiceEvent } from './voice-event-taxonomy'

const MAX_EVENTS_PER_SESSION = 200

export type PersistedVoiceEventRecord = {
  event: string
  at: string
  tenantId: string
  agentId?: string
  sessionId?: string
  callId?: string
  meta?: Record<string, unknown>
}

function readMetadata(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

/** Prisma JSON columns require plain JSON values — round-trip strips custom TS types. */
function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export async function persistVoiceEventToTable(
  prisma: PrismaClient,
  evt: VoiceEvent,
): Promise<void> {
  const { tenantId, agentId, sessionId, callId, meta, at } = evt.payload
  if (!tenantId) return

  await prisma.voiceEvent.create({
    data: {
      tenantId,
      event: evt.event,
      agentId: agentId ?? null,
      sessionId: sessionId ?? null,
      callId: callId ?? null,
      metaJson: meta ? toInputJsonValue(meta) : undefined,
      occurredAt: new Date(at),
    },
  })
}

export async function persistVoiceEventToDemoSession(
  prisma: PrismaClient,
  sessionId: string,
  evt: VoiceEvent,
): Promise<void> {
  const session = await prisma.voiceDemoSession.findUnique({
    where: { id: sessionId },
    select: { metadataJson: true },
  })
  if (!session) return

  const prior = readMetadata(session.metadataJson)
  const existing = Array.isArray(prior.voiceEvents)
    ? (prior.voiceEvents as PersistedVoiceEventRecord[])
    : []

  const record: PersistedVoiceEventRecord = {
    event: evt.event,
    at: evt.payload.at,
    tenantId: evt.payload.tenantId,
    agentId: evt.payload.agentId,
    sessionId: evt.payload.sessionId,
    callId: evt.payload.callId,
    meta: evt.payload.meta,
  }

  const voiceEvents = [...existing, record].slice(-MAX_EVENTS_PER_SESSION)

  await prisma.voiceDemoSession.update({
    where: { id: sessionId },
    data: {
      metadataJson: toInputJsonValue({
        ...prior,
        voiceEvents,
        lastVoiceEventAt: record.at,
      }),
    },
  })

  try {
    await persistVoiceEventToTable(prisma, evt)
  } catch (error) {
    console.warn('[voice-event] table persist failed', error instanceof Error ? error.message : error)
  }
}
