import 'server-only'

/** Prefer top-level `VoiceAgentCall.recordingUrl`, then `VoiceAgentCallMetadata.recordingUrl`. */
export function resolveVoiceAgentRecordingUrl(v: {
  recordingUrl: string | null
  metadata: { recordingUrl: string | null } | null
}): string | null {
  const a = v.recordingUrl?.trim()
  if (a) return a
  const b = v.metadata?.recordingUrl?.trim()
  return b || null
}
