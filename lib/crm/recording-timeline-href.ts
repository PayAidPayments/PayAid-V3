import { hrefForCallTranscriptTimeline } from '@/lib/crm/call-transcript-timeline-href'

/**
 * Deep links for AI call recording rows on unified timelines (client + server safe).
 * Prefer direct recording URL when http(s); else CRM Calls transcript drilldown when `callId`
 * is known; else deal, Dialer with contact, or Calls list.
 */
function asHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  if (t.startsWith('https://') || t.startsWith('http://')) return t
  return null
}

export function hrefForCallRecordingTimeline(
  tenantId: string,
  meta: { recordingUrl?: unknown; contactId?: unknown; dealId?: unknown; callId?: unknown }
): string | null {
  const ext = asHttpUrl(meta.recordingUrl)
  if (ext) return ext
  const callIdRaw = meta.callId
  if (callIdRaw != null && String(callIdRaw).trim() !== '') {
    return hrefForCallTranscriptTimeline(tenantId, String(callIdRaw))
  }
  const deal = meta.dealId != null && String(meta.dealId).trim() !== '' ? String(meta.dealId) : ''
  if (deal) return `/crm/${tenantId}/Deals/${encodeURIComponent(deal)}`
  const ct = meta.contactId != null && String(meta.contactId).trim() !== '' ? String(meta.contactId) : ''
  if (ct) return `/crm/${tenantId}/Dialer?contactId=${encodeURIComponent(ct)}`
  return `/crm/${tenantId}/Calls`
}
