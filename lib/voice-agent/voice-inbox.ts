/**
 * Voice Inbox — sessions routed to no_crm_inbox (standalone / CRM-off demos).
 */

import type { PrismaClient } from '@prisma/client'

export type VoiceInboxItem = {
  sessionId: string
  agentId: string
  agentName?: string
  endedAt?: string
  callerPhone?: string
  routing: string
  disposition?: string
  summary?: string
  sentiment?: string
  objectionTags: string[]
  turnCount?: number
}

function readMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

function readPostCall(meta: Record<string, unknown>) {
  const postCall = meta.postCall
  if (!postCall || typeof postCall !== 'object' || Array.isArray(postCall)) return null
  return postCall as {
    routing?: string
    disposition?: string
    summary?: string
    sentiment?: { sentiment?: string }
    objectionTags?: string[]
    entities?: { turnCount?: number }
    crm?: { inboxOnly?: boolean }
  }
}

export function isVoiceInboxSession(meta: Record<string, unknown>): boolean {
  const postCall = readPostCall(meta)
  if (!postCall) return false
  if (postCall.routing === 'no_crm_inbox') return true
  if (postCall.crm?.inboxOnly === true) return true
  if (postCall.disposition === 'spoken_demo_inbox') return true
  return false
}

export async function loadVoiceInbox(
  prisma: PrismaClient,
  input: { tenantId: string; agentId?: string; limit?: number },
): Promise<VoiceInboxItem[]> {
  const sessions = await prisma.voiceDemoSession.findMany({
    where: {
      tenantId: input.tenantId,
      status: 'ended',
      ...(input.agentId ? { voiceAgentId: input.agentId } : {}),
    },
    select: {
      id: true,
      voiceAgentId: true,
      endedAt: true,
      metadataJson: true,
      agent: { select: { name: true } },
    },
    orderBy: { endedAt: 'desc' },
    take: Math.min(input.limit ?? 100, 200) * 3,
  })

  const items: VoiceInboxItem[] = []

  for (const session of sessions) {
    const meta = readMeta(session.metadataJson)
    if (!isVoiceInboxSession(meta)) continue

    const postCall = readPostCall(meta)!
    const callerPhone =
      typeof meta.callerPhone === 'string'
        ? meta.callerPhone
        : typeof postCall.crm === 'object' && postCall.crm && 'callerPhone' in postCall.crm
          ? String((postCall.crm as { callerPhone?: string }).callerPhone ?? '')
          : undefined

    items.push({
      sessionId: session.id,
      agentId: session.voiceAgentId,
      agentName: session.agent?.name,
      endedAt: session.endedAt?.toISOString(),
      callerPhone: callerPhone || undefined,
      routing: postCall.routing ?? 'no_crm_inbox',
      disposition: postCall.disposition,
      summary: postCall.summary,
      sentiment: postCall.sentiment?.sentiment,
      objectionTags: Array.isArray(postCall.objectionTags) ? postCall.objectionTags : [],
      turnCount: postCall.entities?.turnCount,
    })

    if (items.length >= (input.limit ?? 100)) break
  }

  return items
}
