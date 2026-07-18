import { prisma } from '@/lib/db/prisma'
import { buildInboxReplyStudioHref } from '@/lib/marketing/inbox-reply'

export type UnifiedInboxItem = {
  id: string
  source: 'social' | 'whatsapp' | 'email'
  channel: string
  action: string
  actorName: string | null
  preview: string | null
  at: string
  requiresResponse: boolean
  replyHref: string
}

export type UnifiedInboxSummary = {
  mentions: number
  comments: number
  dms: number
  whatsapp: number
  email: number
}

const SOCIAL_MENTION_ACTIONS = ['mention', 'tag', 'share']
const SOCIAL_COMMENT_ACTIONS = ['comment', 'reply']
const SOCIAL_DM_ACTIONS = ['message', 'dm']

const INBOUND_WA_DIRECTIONS = ['inbound', 'INBOUND', 'incoming', 'INCOMING']

function requiresSocialResponse(action: string) {
  return SOCIAL_COMMENT_ACTIONS.includes(action) || SOCIAL_DM_ACTIONS.includes(action)
}

export async function fetchUnifiedInbox(
  tenantId: string,
  options?: { sinceDays?: number; limit?: number },
): Promise<{ items: UnifiedInboxItem[]; summary: UnifiedInboxSummary }> {
  const sinceDays = options?.sinceDays ?? 7
  const limit = options?.limit ?? 12
  const since = new Date(Date.now() - sinceDays * 86400000)

  const [socialRows, waMessages, emailMessages, mentionCount, commentCount, dmCount, waCount, emailCount] =
    await Promise.all([
      prisma.socialActivityEvent
        .findMany({
          where: { tenantId, eventAt: { gte: since } },
          orderBy: { eventAt: 'desc' },
          take: limit * 2,
          select: {
            id: true,
            action: true,
            platform: true,
            actorName: true,
            objectText: true,
            eventAt: true,
          },
        })
        .catch(() => []),
      prisma.whatsappMessage
        .findMany({
          where: {
            direction: { in: INBOUND_WA_DIRECTIONS },
            createdAt: { gte: since },
            conversation: { account: { tenantId } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            text: true,
            createdAt: true,
            fromNumber: true,
            conversation: {
              select: {
                contact: { select: { name: true, phone: true } },
              },
            },
          },
        })
        .catch(() => []),
      prisma.emailMessage
        .findMany({
          where: {
            account: { tenantId },
            isDraft: false,
            receivedAt: { gte: since },
            OR: [{ folder: { type: { in: ['inbox', 'INBOX'] } } }, { inReplyTo: { not: null } }],
          },
          orderBy: { receivedAt: 'desc' },
          take: limit,
          select: {
            id: true,
            fromName: true,
            fromEmail: true,
            subject: true,
            body: true,
            receivedAt: true,
            inReplyTo: true,
          },
        })
        .catch(() => []),
      prisma.socialActivityEvent
        .count({
          where: {
            tenantId,
            action: { in: SOCIAL_MENTION_ACTIONS },
            eventAt: { gte: since },
          },
        })
        .catch(() => 0),
      prisma.socialActivityEvent
        .count({
          where: {
            tenantId,
            action: { in: SOCIAL_COMMENT_ACTIONS },
            eventAt: { gte: since },
          },
        })
        .catch(() => 0),
      prisma.socialActivityEvent
        .count({
          where: {
            tenantId,
            action: { in: SOCIAL_DM_ACTIONS },
            eventAt: { gte: since },
          },
        })
        .catch(() => 0),
      prisma.whatsappMessage
        .count({
          where: {
            direction: { in: INBOUND_WA_DIRECTIONS },
            createdAt: { gte: since },
            conversation: { account: { tenantId } },
          },
        })
        .catch(() => 0),
      prisma.emailMessage
        .count({
          where: {
            account: { tenantId },
            isDraft: false,
            receivedAt: { gte: since },
            OR: [{ folder: { type: { in: ['inbox', 'INBOX'] } } }, { inReplyTo: { not: null } }],
          },
        })
        .catch(() => 0),
    ])

  const socialItems: UnifiedInboxItem[] = socialRows.map((e) => ({
    id: `social-${e.id}`,
    source: 'social',
    channel: e.platform,
    action: e.action,
    actorName: e.actorName,
    preview: e.objectText ? e.objectText.slice(0, 160) : null,
    at: e.eventAt.toISOString(),
    requiresResponse: requiresSocialResponse(e.action),
  }))

  const waItems: UnifiedInboxItem[] = waMessages.map((m) => ({
    id: `wa-${m.id}`,
    source: 'whatsapp',
    channel: 'whatsapp',
    action: 'inbound',
    actorName: m.conversation.contact.name || m.fromNumber,
    preview: m.text ? m.text.slice(0, 160) : null,
    at: m.createdAt.toISOString(),
    requiresResponse: true,
  }))

  const emailItems: UnifiedInboxItem[] = emailMessages.map((m) => ({
    id: `email-${m.id}`,
    source: 'email',
    channel: 'email',
    action: m.inReplyTo ? 'reply' : 'inbound',
    actorName: m.fromName || m.fromEmail,
    preview: (m.subject || m.body || '').slice(0, 160) || null,
    at: m.receivedAt.toISOString(),
    requiresResponse: true,
  }))

  const items = [...socialItems, ...waItems, ...emailItems]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit)
    .map((item) => ({
      ...item,
      replyHref: buildInboxReplyStudioHref(tenantId, item),
    }))

  return {
    items,
    summary: {
      mentions: mentionCount,
      comments: commentCount,
      dms: dmCount,
      whatsapp: waCount,
      email: emailCount,
    },
  }
}
