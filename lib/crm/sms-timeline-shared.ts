import 'server-only'

/** Human-readable title for `SMSDeliveryReport` rows on unified timelines. */
export function titleForSmsDeliveryReport(status: string | null | undefined): string {
  const s = (status || '').toUpperCase()
  if (s.includes('FAIL')) return 'SMS failed'
  if (s === 'DELIVERED') return 'SMS delivered'
  if (s === 'PENDING') return 'SMS pending'
  return 'SMS sent'
}
