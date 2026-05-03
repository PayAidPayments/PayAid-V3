/**
 * Deep links for native SMS delivery rows on unified timelines (client + server safe).
 * Prefer marketing campaign detail when `campaignId` is set; else CRM contact.
 * When linking from a specific `SMSDeliveryReport` row, pass `smsDeliveryReportId` so the campaign
 * page can show a lightweight `smsReportId` drilldown banner (parity with email `trackingEventId`).
 */
export function hrefForSmsDeliveryTimelineDetail(
  tenantId: string,
  ctx: {
    campaignId?: string | null
    contactId?: string | null
    smsDeliveryReportId?: string | null
  }
): string | null {
  const c = ctx.campaignId != null && String(ctx.campaignId).trim() !== '' ? String(ctx.campaignId) : ''
  if (c) {
    const base = `/marketing/${tenantId}/Campaigns/${encodeURIComponent(c)}`
    const reportId =
      ctx.smsDeliveryReportId != null && String(ctx.smsDeliveryReportId).trim() !== ''
        ? String(ctx.smsDeliveryReportId)
        : ''
    if (reportId) {
      const q = new URLSearchParams()
      q.set('smsReportId', reportId)
      return `${base}?${q.toString()}`
    }
    return base
  }
  const ct = ctx.contactId != null && String(ctx.contactId).trim() !== '' ? String(ctx.contactId) : ''
  if (ct) return `/crm/${tenantId}/Contacts/${encodeURIComponent(ct)}`
  return null
}
