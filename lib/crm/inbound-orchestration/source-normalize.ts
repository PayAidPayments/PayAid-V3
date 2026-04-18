import type { InboundContactFields, InboundSourceAttribution } from './types'

export function trimEmail(email: string | null | undefined): string | undefined {
  if (email == null) return undefined
  const t = String(email).trim().toLowerCase()
  return t === '' ? undefined : t
}

export function trimPhone(phone: string | null | undefined): string | undefined {
  if (phone == null) return undefined
  const t = String(phone).trim()
  return t === '' ? undefined : t
}

export function normalizeInboundContactFields(
  contact: InboundContactFields
): InboundContactFields {
  const email = trimEmail(contact.email ?? undefined)
  const phone = trimPhone(contact.phone ?? undefined)
  const company = contact.company?.trim() || undefined
  const name = contact.name?.trim() || 'Unknown'
  return {
    ...contact,
    name,
    email: email ?? null,
    phone: phone ?? null,
    company: company ?? null,
    tags: Array.isArray(contact.tags) ? contact.tags.map((t) => String(t).trim()).filter(Boolean) : [],
  }
}

export function normalizeSourceAttribution(
  source: InboundSourceAttribution,
  capturedAt = new Date()
): InboundSourceAttribution {
  return {
    ...source,
    sourceChannel: source.sourceChannel.trim(),
    sourceSubchannel: source.sourceSubchannel?.trim(),
    sourceCampaign: source.sourceCampaign?.trim(),
    sourceAsset: source.sourceAsset?.trim(),
    sourceRef: source.sourceRef?.trim(),
    capturedAt: source.capturedAt ?? capturedAt.toISOString(),
    capturedBy: source.capturedBy,
    rawMetadata:
      source.rawMetadata && typeof source.rawMetadata === 'object' ? source.rawMetadata : undefined,
  }
}

/** v1 heuristic: completeness + light intent from metadata flag */
export function computeInboundLeadScoreV1(
  contact: InboundContactFields,
  rawMetadata?: Record<string, unknown>
): number {
  let score = 0
  if (contact.email) score += 12
  if (contact.phone) score += 10
  if (contact.company) score += 6
  if (contact.city || contact.state) score += 4
  const intent =
    rawMetadata && typeof rawMetadata.intentScore === 'number' ? rawMetadata.intentScore : undefined
  if (typeof intent === 'number' && !Number.isNaN(intent)) {
    score += Math.min(25, Math.max(0, intent))
  }
  return Math.round(Math.min(100, score) * 10) / 10
}

export function buildPayaidSourcePayload(
  normalizedSource: InboundSourceAttribution,
  previous?: unknown
): Record<string, unknown> {
  const prev =
    previous && typeof previous === 'object' && !Array.isArray(previous)
      ? (previous as Record<string, unknown>)
      : {}
  const history = Array.isArray(prev.payaidInboundHistory)
    ? [...(prev.payaidInboundHistory as unknown[])]
    : []
  history.push({
    at: normalizedSource.capturedAt,
    channel: normalizedSource.sourceChannel,
    subchannel: normalizedSource.sourceSubchannel,
  })
  return {
    ...prev,
    payaidSource: normalizedSource,
    payaidInboundHistory: history.slice(-20),
  }
}
