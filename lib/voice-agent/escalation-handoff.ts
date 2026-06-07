/**
 * Escalation context payload for human transfer (Phase 2.4 foundation).
 */

export type EscalationHandoffPayload = {
  tenantId: string
  agentId: string
  sessionId?: string
  callId?: string
  callerPhone?: string | null
  summary?: string
  disposition?: string
  objectionTags?: string[]
  sentiment?: string
  transcriptPreview?: string
  requestedAt: string
}

export function buildEscalationHandoffPayload(input: {
  tenantId: string
  agentId: string
  sessionId?: string
  callId?: string
  callerPhone?: string | null
  summary?: string
  disposition?: string
  objectionTags?: string[]
  sentiment?: string
  transcriptLines?: Array<{ role: string; content: string }>
}): EscalationHandoffPayload {
  const userLines = (input.transcriptLines || [])
    .filter((t) => t.role === 'user')
    .map((t) => t.content.trim())
    .slice(-3)
  return {
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
    callId: input.callId,
    callerPhone: input.callerPhone,
    summary: input.summary,
    disposition: input.disposition,
    objectionTags: input.objectionTags,
    sentiment: input.sentiment,
    transcriptPreview: userLines.join(' | ').slice(0, 500) || undefined,
    requestedAt: new Date().toISOString(),
  }
}
