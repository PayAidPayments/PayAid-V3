/**
 * Normalize social webhook payloads into rows for SocialActivityEvent.
 * Shapes vary by provider; unknown payloads return [] (no-op).
 */

export type SocialActivityNormalizedEvent = {
  accountExternalId?: string
  platform: string
  providerEventId?: string
  source?: string
  action: string
  actorName?: string | null
  actorHandle?: string | null
  actorAvatar?: string | null
  objectType?: string | null
  objectId?: string | null
  objectText?: string | null
  eventAt?: Date
  metadata?: unknown
}

function ev(
  partial: Partial<SocialActivityNormalizedEvent> & { action: string; platform: string }
): SocialActivityNormalizedEvent {
  return {
    platform: partial.platform,
    action: partial.action,
    accountExternalId: partial.accountExternalId,
    providerEventId: partial.providerEventId,
    source: partial.source,
    actorName: partial.actorName ?? null,
    actorHandle: partial.actorHandle ?? null,
    actorAvatar: partial.actorAvatar ?? null,
    objectType: partial.objectType ?? null,
    objectId: partial.objectId ?? null,
    objectText: partial.objectText ?? null,
    eventAt: partial.eventAt ?? new Date(),
    metadata: partial.metadata,
  }
}

/** LinkedIn Marketing / Events webhooks — best-effort; extend when real payloads are fixed. */
export function normalizeLinkedInPayload(payload: unknown): SocialActivityNormalizedEvent[] {
  if (payload == null || typeof payload !== 'object') return []
  const o = payload as Record<string, unknown>

  if (Array.isArray(o.events)) {
    return o.events.flatMap((e) => normalizeLinkedInPayload(e))
  }
  if (Array.isArray(o.items)) {
    return o.items.flatMap((e) => normalizeLinkedInPayload(e))
  }

  const accountExternalId =
    (typeof o.accountId === 'string' && o.accountId) ||
    (typeof o.account === 'string' && o.account) ||
    (typeof o.organizationId === 'string' && o.organizationId) ||
    undefined

  const actor =
    o.actor && typeof o.actor === 'object' ? (o.actor as Record<string, unknown>) : null
  const actorId = actor && typeof actor.id === 'string' ? actor.id : undefined

  const action =
    (typeof o.action === 'string' && o.action) ||
    (typeof o.type === 'string' && o.type) ||
    (typeof o.eventType === 'string' && o.eventType) ||
    'activity'

  const id =
    (typeof o.id === 'string' && o.id) ||
    (typeof o.urn === 'string' && o.urn) ||
    (typeof o.eventId === 'string' && o.eventId) ||
    undefined

  const text =
    (typeof o.text === 'string' && o.text) ||
    (typeof o.message === 'string' && o.message) ||
    undefined

  const external = accountExternalId || actorId
  if (!external && !id) return []

  return [
    ev({
      platform: 'linkedin',
      action,
      accountExternalId: external,
      providerEventId: id,
      objectText: text ?? null,
      actorName: actor && typeof actor.name === 'string' ? actor.name : null,
      metadata: o,
      source: 'linkedin-webhook',
    }),
  ]
}

/** Meta (Facebook / Instagram) — classic `object` + `entry[].changes[]` shape. */
export function normalizeMetaPayload(payload: unknown): SocialActivityNormalizedEvent[] {
  if (payload == null || typeof payload !== 'object') return []
  const o = payload as Record<string, unknown>
  const object = typeof o.object === 'string' ? o.object : 'page'
  const platform: 'facebook' | 'instagram' = object === 'instagram' ? 'instagram' : 'facebook'

  const entry = o.entry
  if (!Array.isArray(entry)) return []

  const out: SocialActivityNormalizedEvent[] = []
  for (const ent of entry) {
    if (!ent || typeof ent !== 'object') continue
    const e = ent as Record<string, unknown>
    const pageOrIgId = typeof e.id === 'string' ? e.id : undefined
    const changes = e.changes
    if (!Array.isArray(changes)) continue

    for (const ch of changes) {
      if (!ch || typeof ch !== 'object') continue
      const c = ch as Record<string, unknown>
      const field = typeof c.field === 'string' ? c.field : 'change'
      const value = c.value
      let providerEventId: string | undefined
      if (value && typeof value === 'object' && 'id' in (value as object)) {
        const vid = (value as Record<string, unknown>).id
        if (typeof vid === 'string' || typeof vid === 'number') providerEventId = String(vid)
      }

      out.push(
        ev({
          platform,
          action: field,
          accountExternalId: pageOrIgId,
          providerEventId,
          metadata: { entry: e, change: c, object },
          source: 'meta-webhook',
        })
      )
    }
  }
  return out
}
