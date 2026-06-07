/**
 * Voice Agents event taxonomy (blueprint §Event routing).
 * Dot-notation events for analytics, CRM, and workflow consumers.
 */

export type VoiceEventName =
  | 'call.started'
  | 'transcript.partial'
  | 'barge_in.detected'
  | 'call.completed'
  | 'summary.ready'
  | 'crm.match.failed'
  | 'lead.triggered.call'
  | 'crm.stage.triggered'
  | 'missed_call.callback'
  | 'escalation.requested'
  | 'escalation.transfer.requested'

export type VoiceEventPayload = {
  tenantId: string
  agentId?: string
  sessionId?: string
  callId?: string
  at: string
  meta?: Record<string, unknown>
}

export type VoiceEvent = {
  event: VoiceEventName
  payload: VoiceEventPayload
}

/** Map browser-live / Bolna wire events to blueprint taxonomy (for logging and future bus). */
export function mapBrowserLiveToVoiceEvent(
  wireType: string,
  ctx: Omit<VoiceEventPayload, 'at'>,
): VoiceEvent | null {
  const payload: VoiceEventPayload = { ...ctx, at: new Date().toISOString() }
  switch (wireType) {
    case 'session.ready':
      return { event: 'call.started', payload }
    case 'interrupt.ack':
      return {
        event: 'barge_in.detected',
        payload: { ...payload, meta: { bargeInCount: ctx.meta?.bargeInCount } },
      }
    case 'session.ended':
      return { event: 'call.completed', payload }
    case 'transcript.final':
      return { event: 'transcript.partial', payload: { ...payload, meta: { final: true } } }
    default:
      return null
  }
}

export function formatVoiceEventLog(evt: VoiceEvent): string {
  return JSON.stringify({
    voiceEvent: evt.event,
    tenantId: evt.payload.tenantId,
    agentId: evt.payload.agentId,
    sessionId: evt.payload.sessionId,
    callId: evt.payload.callId,
    at: evt.payload.at,
    meta: evt.payload.meta,
  })
}
