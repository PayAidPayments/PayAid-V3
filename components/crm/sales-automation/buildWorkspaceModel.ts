import type { OutreachCampaign } from './types'

/** Enrich automation row for Sequences / Overview tables (UI-only derived fields). */
export function campaignToSequenceRow(c: OutreachCampaign) {
  const persona =
    c.type === 'linkedin' ? 'SMB / Founder' : c.type === 'cold-email' ? 'Enterprise IT' : 'Mid-market Ops'
  const objective =
    c.type === 'multi-channel'
      ? 'Book qualified demos'
      : c.type === 'cold-call'
        ? 'Re-engage cold accounts'
        : 'Pipeline meetings'
  const channels =
    c.type === 'multi-channel'
      ? 'Email · Call · WA'
      : c.type === 'linkedin'
        ? 'LinkedIn'
        : c.type === 'cold-call'
          ? 'Call · Email'
          : 'Email'
  const meetingRate = Math.min(44, Math.max(1.2, c.conversionRate * 0.55 + (c.responseRate > 15 ? 2 : 0)))
  const op = c.operationStats
  return {
    ...c,
    objective,
    persona,
    channels,
    meetingRate,
    owner: 'Team queue',
    lastUpdated: c.createdAt,
    enrolled: c.prospectsCount,
    activeInSeq:
      op?.activeInSeq ??
      Math.max(0, Math.round(c.prospectsCount * (c.status === 'active' ? 0.62 : 0.15))),
    paused: op?.paused ?? (c.status === 'paused' ? Math.round(c.prospectsCount * 0.2) : 0),
    completed: op?.completed ?? (c.status === 'completed' ? c.prospectsCount : Math.round(c.prospectsCount * 0.08)),
    replied: op?.replied ?? Math.round(c.prospectsCount * (c.responseRate / 100)),
    bounced: op?.bounced ?? Math.max(0, Math.round(c.prospectsCount * 0.02)),
    unsubscribed: op?.unsubscribed ?? Math.max(0, Math.round(c.prospectsCount * 0.01)),
  }
}
