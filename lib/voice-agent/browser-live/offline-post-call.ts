import { buildTranscriptSummary, inferDisposition } from '@/lib/voice-agent/browser-live/post-call-pipeline'
import {
  analyzeTranscriptSentiment,
  extractObjectionTags,
} from '@/lib/voice-agent/browser-live/post-call-intelligence'
import { decideTranscriptRouting, normalizePhone } from '@/lib/voice-agent/browser-live/transcript-routing'
import type { BrowserLivePostCallArtifacts } from '@/lib/voice-agent/browser-live/protocol'

export function buildOfflinePostCallArtifacts(input: {
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>
  callerPhone?: string | null
  crmWritebackEnabled?: boolean
  recordingMime?: string
  recordingData?: string
  bargeInCount?: number
}): BrowserLivePostCallArtifacts {
  const transcriptJson = input.transcript.map((t) => ({
    role: t.role,
    content: t.content,
    timestamp: new Date().toISOString(),
  }))
  const routing = decideTranscriptRouting({
    crmWritebackEnabled: false,
    callerPhone: input.callerPhone,
    matchedContactId: null,
  })
  const summary = buildTranscriptSummary(transcriptJson)
  const disposition = inferDisposition(routing, input.transcript.length)

  let recording: BrowserLivePostCallArtifacts['recording'] | undefined
  if (input.recordingData) {
    recording = {
      mime: input.recordingMime || 'audio/webm',
      data: input.recordingData,
    }
  }

  const phone = normalizePhone(input.callerPhone)

  return {
    routing,
    disposition,
    summary,
    sentiment: analyzeTranscriptSentiment(transcriptJson),
    objectionTags: extractObjectionTags(transcriptJson),
    entities: {
      phones: phone ? [phone] : [],
      emails: [],
      turnCount: input.transcript.length,
    },
    recording,
    crm: { inboxOnly: true },
  }
}
