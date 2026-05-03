/**
 * Deep links for email send / tracking timeline rows (no `server-only`; safe for client + server).
 * Priority: marketing campaign detail → deal → contact.
 * When linking to a campaign from a specific `EmailSendJob`, pass `emailSendJobId` so the campaign
 * UI can scroll/highlight the row in the failed-jobs table when present.
 * For `EmailTrackingEvent` rows with a campaign, pass `emailTrackingEventId` to append `trackingEventId`
 * for lightweight drilldown on the campaign page.
 */
export function hrefForEmailTimelineDetail(
  tenantId: string,
  ctx: {
    campaignId?: string | null
    dealId?: string | null
    contactId?: string | null
    emailSendJobId?: string | null
    emailTrackingEventId?: string | null
  }
): string | null {
  const c = ctx.campaignId != null && String(ctx.campaignId).trim() !== '' ? String(ctx.campaignId) : ''
  if (c) {
    const base = `/marketing/${tenantId}/Campaigns/${encodeURIComponent(c)}`
    const jobId =
      ctx.emailSendJobId != null && String(ctx.emailSendJobId).trim() !== ''
        ? String(ctx.emailSendJobId)
        : ''
    const trackId =
      ctx.emailTrackingEventId != null && String(ctx.emailTrackingEventId).trim() !== ''
        ? String(ctx.emailTrackingEventId)
        : ''
    if (jobId || trackId) {
      const q = new URLSearchParams()
      if (jobId) q.set('emailJobId', jobId)
      if (trackId) q.set('trackingEventId', trackId)
      return `${base}?${q.toString()}`
    }
    return base
  }
  const d = ctx.dealId != null && String(ctx.dealId).trim() !== '' ? String(ctx.dealId) : ''
  if (d) return `/crm/${tenantId}/Deals/${encodeURIComponent(d)}`
  const ct = ctx.contactId != null && String(ctx.contactId).trim() !== '' ? String(ctx.contactId) : ''
  if (ct) return `/crm/${tenantId}/Contacts/${encodeURIComponent(ct)}`
  return null
}
