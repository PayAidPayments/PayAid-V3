export type NormalizedSocialActivity = {
  source?: 'meta-webhook' | 'linkedin-webhook' | 'api'
  platform: 'facebook' | 'instagram' | 'linkedin'
  providerEventId?: string
  accountExternalId?: string
  socialPostExternalId?: string
  actorName?: string
  actorHandle?: string
  actorAvatar?: string
  action: string
  objectType?: string
  objectId?: string
  objectText?: string
  eventAt?: Date
  metadata?: unknown
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function parseDate(v: unknown): Date | undefined {
  if (!v) return undefined
  if (typeof v === 'number') {
    const ms = v > 2_000_000_000 ? v * 1000 : v
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? undefined : d
  }
  if (typeof v === 'string') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}

export function normalizeMetaPayload(payload: any): NormalizedSocialActivity[] {
  const events: NormalizedSocialActivity[] = []
  const entries = asArray(payload?.entry)

  for (const entry of entries) {
    const changes = asArray(entry?.changes)
    for (const ch of changes) {
      const value = ch?.value || {}
      const field = String(ch?.field || '').toLowerCase()
      const platform: 'facebook' | 'instagram' =
        field.includes('instagram') || value?.media_product_type === 'INSTAGRAM'
          ? 'instagram'
          : 'facebook'

      const verb = String(value?.verb || value?.item || value?.reaction_type || '').toLowerCase()
      const action =
        verb.includes('comment') ? 'commented on your post'
        : verb.includes('like') || verb.includes('reaction') ? 'liked your post'
        : 'interacted with your post'

      events.push({
        source: 'meta-webhook',
        platform,
        providerEventId: String(value?.comment_id || value?.reaction_id || value?.id || ''),
        accountExternalId: String(value?.page_id || entry?.id || value?.from?.id || ''),
        socialPostExternalId: String(value?.post_id || value?.media_id || value?.parent_id || ''),
        actorName: value?.from?.name || value?.sender_name || undefined,
        actorHandle: value?.from?.id ? `@${value.from.id}` : undefined,
        action,
        objectType: field || value?.item || 'post',
        objectId: String(value?.comment_id || value?.reaction_id || value?.id || ''),
        objectText: value?.message || value?.comment_text || value?.text || undefined,
        eventAt: parseDate(value?.created_time || value?.timestamp || entry?.time),
        metadata: { source: 'meta-webhook', field, raw: value },
      })
    }

    const messaging = asArray(entry?.messaging)
    for (const msg of messaging) {
      const reaction = msg?.reaction
      const text = msg?.message?.text
      const action =
        reaction ? 'reacted to your message'
        : text ? 'sent a message'
        : 'engaged with your page'
      events.push({
        source: 'meta-webhook',
        platform: 'facebook',
        providerEventId: String(msg?.mid || msg?.reaction?.mid || ''),
        accountExternalId: String(entry?.id || msg?.recipient?.id || ''),
        actorName: undefined,
        actorHandle: msg?.sender?.id ? `@${msg.sender.id}` : undefined,
        action,
        objectType: reaction ? 'message_reaction' : 'message',
        objectId: String(msg?.mid || msg?.reaction?.mid || ''),
        objectText: text || reaction?.emoji || undefined,
        eventAt: parseDate(msg?.timestamp || entry?.time),
        metadata: { source: 'meta-webhook', raw: msg },
      })
    }
  }

  return events.filter((e) => e.action && e.platform)
}

export function normalizeLinkedInPayload(payload: any): NormalizedSocialActivity[] {
  const events: NormalizedSocialActivity[] = []
  const rows = asArray(payload?.elements || payload?.events || payload)

  for (const row of rows) {
    const rawType = String(row?.eventType || row?.type || row?.action || '').toLowerCase()
    const action =
      rawType.includes('comment') ? 'commented on your post'
      : rawType.includes('like') || rawType.includes('reaction') ? 'liked your post'
      : 'interacted with your post'

    events.push({
      source: 'linkedin-webhook',
      platform: 'linkedin',
      providerEventId: String(row?.id || row?.eventId || ''),
      accountExternalId: String(row?.organizationId || row?.organization || row?.author || ''),
      socialPostExternalId: String(row?.ugcPost || row?.share || row?.postId || ''),
      actorName: row?.actorName || row?.memberName || undefined,
      actorHandle: row?.actor || row?.member ? `@${row.actor || row.member}` : undefined,
      action,
      objectType: row?.objectType || 'post',
      objectId: String(row?.id || row?.eventId || ''),
      objectText: row?.message || row?.comment || row?.text || undefined,
      eventAt: parseDate(row?.createdAt || row?.time || row?.timestamp),
      metadata: { source: 'linkedin-webhook', eventType: rawType, raw: row },
    })
  }

  return events.filter((e) => e.action && e.platform)
}

