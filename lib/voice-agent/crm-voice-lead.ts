/**
 * CRM helpers for Voice Agents blueprint routing.
 * Unmatched callers become Voice Lead (Unverified) contacts — not duplicate matched records.
 */

export const VOICE_LEAD_UNVERIFIED_SOURCE = 'voice_agent' as const
export const VOICE_LEAD_UNVERIFIED_TAG = 'voice-lead-unverified' as const

export type VoiceLeadSourceChannel = 'browser_live' | 'telephony' | 'campaign'

export type VoiceLeadUnverifiedSourceData = {
  voiceLeadType: 'unverified'
  verificationStatus: 'pending' | 'verified' | 'merged' | 'rejected'
  matchConfidence: number
  sessionId?: string
  callId?: string
  agentId?: string
  channel: VoiceLeadSourceChannel
  language?: string | null
  disposition?: string
  summaryPreview?: string
  capturedAt: string
}

export type CreateVoiceLeadUnverifiedInput = {
  tenantId: string
  phone: string
  displayPhone?: string | null
  nameIfCaptured?: string | null
  agentId?: string
  sessionId?: string
  callId?: string
  channel: VoiceLeadSourceChannel
  language?: string | null
  disposition?: string
  summary?: string
}

export function buildVoiceLeadUnverifiedContactData(input: CreateVoiceLeadUnverifiedInput) {
  const phone = input.displayPhone?.trim() || input.phone
  const name =
    input.nameIfCaptured?.trim() ||
    `Voice lead ${input.phone.slice(-4)}`

  const sourceData: VoiceLeadUnverifiedSourceData = {
    voiceLeadType: 'unverified',
    verificationStatus: 'pending',
    matchConfidence: 0,
    sessionId: input.sessionId,
    callId: input.callId,
    agentId: input.agentId,
    channel: input.channel,
    language: input.language ?? null,
    disposition: input.disposition,
    summaryPreview: input.summary?.slice(0, 500),
    capturedAt: new Date().toISOString(),
  }

  return {
    tenantId: input.tenantId,
    name,
    phone,
    stage: 'prospect' as const,
    source: VOICE_LEAD_UNVERIFIED_SOURCE,
    // agentId lives in sourceData — sourceId FK is LeadSource only
    sourceId: null,
    sourceData,
    tags: [VOICE_LEAD_UNVERIFIED_TAG],
    notes: 'Auto-created from voice demo/call — pending verification.',
  }
}

export function isVoiceLeadUnverified(contact: {
  source?: string | null
  tags?: string[] | null
  sourceData?: unknown
}): boolean {
  if (contact.source === VOICE_LEAD_UNVERIFIED_SOURCE) return true
  if (contact.tags?.includes(VOICE_LEAD_UNVERIFIED_TAG)) return true
  if (
    contact.sourceData &&
    typeof contact.sourceData === 'object' &&
    !Array.isArray(contact.sourceData) &&
    (contact.sourceData as VoiceLeadUnverifiedSourceData).voiceLeadType === 'unverified'
  ) {
    return true
  }
  return false
}
