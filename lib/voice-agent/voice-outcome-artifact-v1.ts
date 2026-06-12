/**
 * Voice Agents v1 outcome + artifact contract (metadata-based freeze).
 *
 * Phase 3 closeout: VoiceOutcome and VoiceArtifact remain embedded in existing rows
 * until a dedicated migration is justified by query volume.
 */
export const VOICE_OUTCOME_ARTIFACT_V1 = 'voice-outcome-artifact-v1' as const

export type VoiceOutcomeV1 = {
  schema: typeof VOICE_OUTCOME_ARTIFACT_V1
  disposition: string
  summary?: string
  sentiment?: string
  extractedEntities?: Record<string, unknown>
  escalationRequired?: boolean
  followupDueAt?: string
  objectionTags?: string[]
  routing?: string
}

export type VoiceArtifactV1 = {
  schema: typeof VOICE_OUTCOME_ARTIFACT_V1
  recordingUrl?: string | null
  recordingMime?: string | null
  transcriptRef?: string | null
  transcriptTurnCount?: number
  summaryJson?: Record<string, unknown>
  consentMetadata?: Record<string, unknown>
}

function readMeta(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return {}
}

export function readVoiceOutcomeV1(source: {
  outcomeCode?: string | null
  metadataJson?: unknown
  metadata?: unknown
}): VoiceOutcomeV1 | null {
  const meta = readMeta(source.metadataJson ?? source.metadata)
  const postCall = readMeta(meta.postCall)
  const disposition =
    (typeof postCall.disposition === 'string' && postCall.disposition) ||
    (typeof source.outcomeCode === 'string' && source.outcomeCode) ||
    null
  if (!disposition) return null

  return {
    schema: VOICE_OUTCOME_ARTIFACT_V1,
    disposition,
    summary: typeof postCall.summary === 'string' ? postCall.summary : undefined,
    sentiment: typeof postCall.sentiment === 'string' ? postCall.sentiment : undefined,
    extractedEntities:
      postCall.entities && typeof postCall.entities === 'object'
        ? (postCall.entities as Record<string, unknown>)
        : undefined,
    escalationRequired: postCall.escalationRequired === true,
    followupDueAt:
      typeof postCall.followupDueAt === 'string' ? postCall.followupDueAt : undefined,
    objectionTags: Array.isArray(postCall.objectionTags)
      ? postCall.objectionTags.filter((t): t is string => typeof t === 'string')
      : undefined,
    routing: typeof postCall.routing === 'string' ? postCall.routing : undefined,
  }
}

export function readVoiceArtifactV1(source: {
  recordingUrl?: string | null
  transcriptJson?: unknown
  transcript?: string | null
  metadataJson?: unknown
  metadata?: unknown
}): VoiceArtifactV1 | null {
  const meta = readMeta(source.metadataJson ?? source.metadata)
  const postCall = readMeta(meta.postCall)
  const recordingUrl =
    source.recordingUrl ??
    (typeof postCall.recordingUrl === 'string' ? postCall.recordingUrl : null) ??
    (postCall.recording && typeof postCall.recording === 'object'
      ? ((postCall.recording as Record<string, unknown>).url as string | undefined)
      : undefined)

  const transcriptTurnCount = Array.isArray(source.transcriptJson)
    ? source.transcriptJson.length
    : source.transcript
      ? 1
      : typeof postCall.transcriptTurnCount === 'number'
        ? postCall.transcriptTurnCount
        : 0

  if (!recordingUrl && transcriptTurnCount === 0 && !postCall.summary) return null

  return {
    schema: VOICE_OUTCOME_ARTIFACT_V1,
    recordingUrl: recordingUrl ?? null,
    recordingMime:
      typeof postCall.recordingMime === 'string'
        ? postCall.recordingMime
        : postCall.recording && typeof postCall.recording === 'object'
          ? ((postCall.recording as Record<string, unknown>).mime as string | undefined)
          : null,
    transcriptRef: source.transcript ? 'inline' : null,
    transcriptTurnCount,
    summaryJson: postCall.summary ? { text: postCall.summary } : undefined,
    consentMetadata:
      meta.complianceAudit && typeof meta.complianceAudit === 'object'
        ? { entries: meta.complianceAudit }
        : undefined,
  }
}
