/**
 * Deep link to CRM Call History with a specific row focused and transcript fetched.
 * `callId` is the CRM dialer `AICall` id (same id used by `/api/v1/calls/:id/transcript`).
 */
export function hrefForCallTranscriptTimeline(tenantId: string, callId: string): string {
  const q = new URLSearchParams()
  q.set('callId', callId)
  q.set('expandTranscript', '1')
  return `/crm/${tenantId}/Calls?${q.toString()}`
}
