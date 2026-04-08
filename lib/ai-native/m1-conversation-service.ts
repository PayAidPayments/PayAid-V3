import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'
import type { ConversationIngest } from '@/lib/ai-native/m1-conversations'
import {
  computeUniboxSlaPresentation,
  resolveSlaDueAtFromIngest,
  resolveSlaDueAtWithDefaultMinutes,
} from '@/lib/ai-native/m1-conversation-sla'

export { computeUniboxSlaPresentation, resolveSlaDueAtFromIngest, resolveSlaDueAtWithDefaultMinutes }

const CONVERSATION_INGEST_ENTITY = 'unibox_conversation_ingest'
const DEFAULT_UNIBOX_SLA_MINUTES = 30

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

/** Derived row for GET /api/v1/conversations. */
export type ConversationListItem = {
  id: string
  idempotency_key: string
  conversation_id: string
  channel: string
  direction: string
  body_preview: string
  occurred_at: string
  ingested_at: string
  changed_by: string
  status: string
  owner_user_id: string | null
  tags: string[]
  sentiment: string | null
  sla_due_at: string | null
}

function preview(body: string): string {
  return body.length > 160 ? `${body.slice(0, 157)}...` : body
}

function statusFromSnapshot(snap: ConversationIngest | null): string {
  const m = snap?.metadata as Record<string, unknown> | undefined
  const raw = m?.status
  return typeof raw === 'string' && raw.length > 0 ? raw : 'open'
}

function ownerFromSnapshot(snap: ConversationIngest | null): string | null {
  const m = snap?.metadata as Record<string, unknown> | undefined
  const raw = m?.owner_user_id
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

function tagsFromSnapshot(snap: ConversationIngest | null): string[] {
  const m = snap?.metadata as Record<string, unknown> | undefined
  const raw = m?.tags
  if (!Array.isArray(raw)) return []
  return raw.filter((t): t is string => typeof t === 'string')
}

function sentimentFromMetadata(metadata: Record<string, unknown> | undefined): string | undefined {
  const raw = metadata?.sentiment
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined
}

export async function hasConversationIngestBeenRecorded(tenantId: string, idempotencyKey: string) {
  return prisma.auditLog.findFirst({
    where: {
      tenantId,
      entityType: CONVERSATION_INGEST_ENTITY,
      entityId: idempotencyKey,
    },
    select: { id: true, timestamp: true },
  })
}

export async function getTenantUniboxSlaSettings(tenantId: string): Promise<{
  first_response_sla_minutes: number
  enforce: boolean
}> {
  const row = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { industrySettings: true },
  })
  const raw = (row?.industrySettings ?? null) as Record<string, unknown> | null
  const unibox = (raw?.unibox_settings ?? null) as Record<string, unknown> | null
  const minsRaw = unibox?.first_response_sla_minutes
  const enforceRaw = unibox?.enforce
  const mins =
    typeof minsRaw === 'number' && Number.isFinite(minsRaw) && minsRaw > 0
      ? Math.floor(minsRaw)
      : DEFAULT_UNIBOX_SLA_MINUTES
  const enforce = typeof enforceRaw === 'boolean' ? enforceRaw : true
  return { first_response_sla_minutes: mins, enforce }
}

export async function updateTenantUniboxSlaSettings(
  tenantId: string,
  payload: { first_response_sla_minutes: number; enforce: boolean }
) {
  const row = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { industrySettings: true },
  })
  const base = ((row?.industrySettings ?? {}) as Record<string, unknown>) || {}
  const next = {
    ...base,
    unibox_settings: {
      first_response_sla_minutes: payload.first_response_sla_minutes,
      enforce: payload.enforce,
    },
  }
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { industrySettings: next },
  })
  return payload
}

/**
 * Records audit + Unibox thread/message in one transaction (idempotent ingest path calls this once).
 */
export async function recordConversationIngest(
  tenantId: string,
  userId: string,
  idempotencyKey: string,
  event: ConversationIngest
) {
  const tenantSettings = await getTenantUniboxSlaSettings(tenantId)
  return prisma.$transaction(async (tx) => {
    const audit = await tx.auditLog.create({
      data: {
        tenantId,
        entityType: CONVERSATION_INGEST_ENTITY,
        entityId: idempotencyKey,
        changedBy: userId,
        changeSummary: `Conversation ingest: ${event.channel} ${event.direction}`,
        afterSnapshot: asInputJson(event),
      },
    })

    const st = statusFromSnapshot(event)
    const owner = ownerFromSnapshot(event)
    const tagList = tagsFromSnapshot(event)
    const meta = event.metadata as Record<string, unknown> | undefined
    const sentiment = sentimentFromMetadata(meta)
    const slaDue = resolveSlaDueAtWithDefaultMinutes(
      event,
      tenantSettings.enforce ? tenantSettings.first_response_sla_minutes : null
    )

    const conv = await tx.uniboxConversation.upsert({
      where: {
        tenantId_threadKey: {
          tenantId,
          threadKey: event.conversation_id,
        },
      },
      create: {
        tenantId,
        threadKey: event.conversation_id,
        channel: event.channel,
        status: st,
        ownerUserId: owner,
        tags: tagList,
        sentiment: sentiment ?? null,
        slaDueAt: slaDue ?? null,
        lastMessageAt: new Date(event.occurred_at),
      },
      update: {
        channel: event.channel,
        lastMessageAt: new Date(event.occurred_at),
        ...(owner ? { ownerUserId: owner } : {}),
        ...(tagList.length > 0 ? { tags: tagList } : {}),
        ...(sentiment !== undefined ? { sentiment } : {}),
        ...(slaDue !== undefined ? { slaDueAt: slaDue } : {}),
      },
    })

    await tx.uniboxMessage.create({
      data: {
        conversationId: conv.id,
        direction: event.direction,
        body: event.body,
        occurredAt: new Date(event.occurred_at),
        metadata: event.metadata as object,
        sourceIngestKey: idempotencyKey,
      },
    })

    return audit
  })
}

/** @deprecated use recordConversationIngest — kept for tests importing legacy name */
export async function persistConversationIngestAudit(
  tenantId: string,
  userId: string,
  idempotencyKey: string,
  payload: ConversationIngest
) {
  return recordConversationIngest(tenantId, userId, idempotencyKey, payload)
}

/**
 * Lists Unibox conversations (DB-backed). Query: channel, status, owner (ownerUserId).
 */
export async function listConversationIngests(params: {
  tenantId: string
  channel?: string
  status?: string
  owner?: string
  limit: number
}): Promise<ConversationListItem[]> {
  const cap = Math.min(Math.max(params.limit, 1), 200)

  const where: {
    tenantId: string
    channel?: string
    status?: string
    ownerUserId?: string
  } = { tenantId: params.tenantId }

  if (params.channel) where.channel = params.channel
  if (params.status) where.status = params.status
  if (params.owner) where.ownerUserId = params.owner

  const rows = await prisma.uniboxConversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take: cap,
    include: {
      messages: {
        orderBy: { occurredAt: 'desc' },
        take: 1,
      },
    },
  })

  return rows.map((row) => {
    const last = row.messages[0]
    const body = last?.body ?? ''
    const dir = last?.direction ?? 'inbound'
    const occ = last?.occurredAt ?? row.lastMessageAt ?? row.createdAt
    return {
      id: row.id,
      idempotency_key: last?.sourceIngestKey ?? '',
      conversation_id: row.threadKey,
      channel: row.channel,
      direction: dir,
      body_preview: preview(body),
      occurred_at: occ.toISOString(),
      ingested_at: row.updatedAt.toISOString(),
      changed_by: row.ownerUserId ?? '—',
      status: row.status,
      owner_user_id: row.ownerUserId,
      tags: row.tags ?? [],
      sentiment: row.sentiment ?? null,
      sla_due_at: row.slaDueAt ? row.slaDueAt.toISOString() : null,
    }
  })
}

/**
 * GET /api/v1/conversations/:id — single thread (for detail envelope + SLA widget).
 */
export async function getUniboxConversationDetail(tenantId: string, conversationId: string) {
  const row = await prisma.uniboxConversation.findFirst({
    where: { id: conversationId, tenantId },
    select: {
      id: true,
      threadKey: true,
      channel: true,
      status: true,
      ownerUserId: true,
      tags: true,
      sentiment: true,
      slaDueAt: true,
      lastMessageAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!row) return null

  const now = Date.now()
  const sla = computeUniboxSlaPresentation({
    slaDueAt: row.slaDueAt,
    status: row.status,
    nowMs: now,
  })

  return {
    schema_version: '1.0' as const,
    id: row.id,
    thread_key: row.threadKey,
    channel: row.channel,
    status: row.status,
    owner_user_id: row.ownerUserId,
    tags: row.tags ?? [],
    sentiment: row.sentiment,
    sla_due_at: row.slaDueAt ? row.slaDueAt.toISOString() : null,
    last_message_at: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    sla: {
      breached: sla.breached,
      due_in_seconds: sla.due_in_seconds,
    },
  }
}

export async function assignUniboxConversation(
  tenantId: string,
  conversationId: string,
  ownerUserId: string
) {
  const updated = await prisma.uniboxConversation.updateMany({
    where: { id: conversationId, tenantId },
    data: { ownerUserId },
  })
  return updated.count
}

export async function appendUniboxReply(
  tenantId: string,
  conversationId: string,
  body: string,
  userId: string
) {
  const conv = await prisma.uniboxConversation.findFirst({
    where: { id: conversationId, tenantId },
    select: { id: true },
  })
  if (!conv) return null

  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.uniboxMessage.create({
      data: {
        conversationId: conv.id,
        direction: 'outbound',
        body,
        occurredAt: now,
        metadata: { author_user_id: userId },
      },
    })
    await tx.uniboxConversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: now },
    })
  })

  return { ok: true as const }
}

export async function tagUniboxConversation(tenantId: string, conversationId: string, tags: string[]) {
  const updated = await prisma.uniboxConversation.updateMany({
    where: { id: conversationId, tenantId },
    data: { tags },
  })
  return updated.count
}

export type UniboxMessagePublic = {
  id: string
  direction: string
  body: string
  occurred_at: string
  metadata: Record<string, unknown> | null
}

/**
 * Chronological messages for one thread (`UniboxConversation.id`).
 * Returns `null` if the conversation id is missing or not in this tenant.
 */
export async function listUniboxMessagesForConversation(
  tenantId: string,
  conversationId: string,
  limit: number
): Promise<UniboxMessagePublic[] | null> {
  const conv = await prisma.uniboxConversation.findFirst({
    where: { id: conversationId, tenantId },
    select: { id: true },
  })
  if (!conv) return null

  const cap = Math.min(Math.max(limit, 1), 500)
  const rows = await prisma.uniboxMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { occurredAt: 'asc' },
    take: cap,
  })

  return rows.map((m) => ({
    id: m.id,
    direction: m.direction,
    body: m.body,
    occurred_at: m.occurredAt.toISOString(),
    metadata: m.metadata && typeof m.metadata === 'object' && !Array.isArray(m.metadata)
      ? (m.metadata as Record<string, unknown>)
      : null,
  }))
}
