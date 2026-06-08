/**
 * Post-call artifact pipeline for browser-live spoken demo sessions.
 */

import type { PrismaClient } from '@prisma/client'
import { parseTranscriptJson } from '@/lib/voice-agent/demo-transcript'
import {
  decideTranscriptRouting,
  normalizePhone,
  type TranscriptRouting,
} from '@/lib/voice-agent/browser-live/transcript-routing'
import {
  findContactIdByPhone,
  nameHintFromTranscript,
  writeMatchedContactCallActivity,
  writeVoiceLeadUnverified,
} from '@/lib/voice-agent/crm-writeback'
import { createVoiceFollowUpTasks } from '@/lib/voice-agent/crm-follow-up-tasks'
import { recordSessionComplianceCloseout } from '@/lib/voice-agent/compliance-audit'
import {
  buildEscalationHandoffPayload,
  type EscalationHandoffPayload,
} from '@/lib/voice-agent/escalation-handoff'
import { emitPostCallVoiceEvents } from '@/lib/voice-agent/browser-live/voice-event-bridge'
import {
  analyzeTranscriptSentiment,
  extractObjectionTags,
  type PostCallSentiment,
} from '@/lib/voice-agent/browser-live/post-call-intelligence'

export type PostCallArtifacts = {
  routing: TranscriptRouting
  disposition: string
  summary: string
  sentiment: PostCallSentiment
  objectionTags: string[]
  escalationHandoff?: EscalationHandoffPayload
  entities: {
    phones: string[]
    emails: string[]
    turnCount: number
  }
  recording?: {
    mime: string
    /** Base64 payload (may be truncated for large blobs). */
    data: string
    truncated?: boolean
  }
  crm?: {
    contactId?: string
    interactionId?: string
    leadCreated?: boolean
    voiceLeadUnverified?: boolean
    inboxOnly?: boolean
    followUpTaskIds?: string[]
    followUpTaskTitles?: string[]
  }
}

const MAX_RECORDING_B64_CHARS = 1_500_000

function extractPhones(text: string): string[] {
  const matches = text.match(/(?:\+?\d[\d\s-]{8,}\d)/g) ?? []
  return [...new Set(matches.map(normalizePhone).filter((p) => p.length >= 10))]
}

function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? []
  return [...new Set(matches.map((e) => e.toLowerCase()))]
}

export function buildTranscriptSummary(transcriptJson: unknown): string {
  const turns = parseTranscriptJson(transcriptJson)
  if (!turns.length) return 'No spoken turns captured.'
  const userLines = turns.filter((t) => t.role === 'user').map((t) => t.content.trim())
  const agentLines = turns.filter((t) => t.role === 'assistant').map((t) => t.content.trim())
  const opener = userLines[0]?.slice(0, 200) || '(no user speech)'
  const closer = agentLines[agentLines.length - 1]?.slice(0, 200) || '(no agent reply)'
  return `Caller opened with: "${opener}". Agent closed with: "${closer}". (${turns.length} transcript lines)`
}

export function inferDisposition(routing: TranscriptRouting, turnCount: number): string {
  if (turnCount === 0) return 'no_conversation'
  switch (routing) {
    case 'matched_contact':
      return 'spoken_demo_matched_contact'
    case 'unmatched_lead':
      return 'spoken_demo_new_lead'
    default:
      return 'spoken_demo_inbox'
  }
}

export type FinalizeBrowserLiveSessionInput = {
  prisma: PrismaClient
  sessionId: string
  tenantId: string
  agentId: string
  callerPhone?: string | null
  crmWritebackEnabled?: boolean
  recordingMime?: string
  recordingData?: string
  bargeInCount?: number
}

export async function finalizeBrowserLiveSession(
  input: FinalizeBrowserLiveSessionInput,
): Promise<PostCallArtifacts | null> {
  const session = await input.prisma.voiceDemoSession.findFirst({
    where: { id: input.sessionId, tenantId: input.tenantId, voiceAgentId: input.agentId },
    include: { agent: true },
  })
  if (!session) return null

  const transcriptText = JSON.stringify(session.transcriptJson ?? [])
  const turns = parseTranscriptJson(session.transcriptJson)
  const phones = extractPhones(transcriptText)
  const emails = extractEmails(transcriptText)

  const normalizedCaller = normalizePhone(input.callerPhone)
  const matchedContactId = await findContactIdByPhone(
    input.prisma,
    input.tenantId,
    input.callerPhone,
  )

  const crmWritebackEnabled = input.crmWritebackEnabled !== false
  const routing = decideTranscriptRouting({
    crmWritebackEnabled,
    callerPhone: input.callerPhone,
    matchedContactId,
  })

  const summary = buildTranscriptSummary(session.transcriptJson)
  const disposition = inferDisposition(routing, turns.length)
  const sentiment = analyzeTranscriptSentiment(session.transcriptJson)
  const objectionTags = extractObjectionTags(session.transcriptJson)

  let recording: PostCallArtifacts['recording'] | undefined
  if (input.recordingData) {
    const data =
      input.recordingData.length > MAX_RECORDING_B64_CHARS
        ? input.recordingData.slice(0, MAX_RECORDING_B64_CHARS)
        : input.recordingData
    recording = {
      mime: input.recordingMime || 'audio/webm',
      data,
      truncated: input.recordingData.length > MAX_RECORDING_B64_CHARS,
    }
  }

  const crmMeta: PostCallArtifacts['crm'] = {}

  if (routing === 'matched_contact' && matchedContactId) {
    const matched = await writeMatchedContactCallActivity({
      prisma: input.prisma,
      contactId: matchedContactId,
      subject: `Live demo: ${session.agent?.name ?? 'Agent'}`,
      notes: summary,
    })
    crmMeta.contactId = matched.contactId
    crmMeta.interactionId = matched.interactionId
  } else if (routing === 'unmatched_lead' && normalizedCaller.length >= 10) {
    const lead = await writeVoiceLeadUnverified({
      prisma: input.prisma,
      tenantId: input.tenantId,
      phone: normalizedCaller,
      displayPhone: input.callerPhone || normalizedCaller,
      nameIfCaptured: nameHintFromTranscript(turns),
      agentId: input.agentId,
      sessionId: input.sessionId,
      channel: 'browser_live',
      language: session.agent?.language,
      disposition,
      summary,
      interactionSubject: `Voice lead (unverified): ${session.agent?.name ?? 'Agent'}`,
      interactionNotes: summary,
    })
    crmMeta.contactId = lead.contactId
    crmMeta.interactionId = lead.interactionId
    crmMeta.leadCreated = true
    crmMeta.voiceLeadUnverified = true
  } else {
    crmMeta.inboxOnly = true
  }

  const contactIdForTasks = crmMeta.contactId
  if (contactIdForTasks && objectionTags.length > 0) {
    const tasks = await createVoiceFollowUpTasks({
      prisma: input.prisma,
      tenantId: input.tenantId,
      contactId: contactIdForTasks,
      objectionTags,
      agentName: session.agent?.name,
      sessionId: input.sessionId,
    })
    if (tasks.taskIds.length) {
      crmMeta.followUpTaskIds = tasks.taskIds
      crmMeta.followUpTaskTitles = tasks.titles
    }
  }

  const escalationHandoff = objectionTags.includes('escalation_request')
    ? buildEscalationHandoffPayload({
        tenantId: input.tenantId,
        agentId: input.agentId,
        sessionId: input.sessionId,
        callerPhone: input.callerPhone,
        summary,
        disposition,
        objectionTags,
        sentiment: sentiment.sentiment,
        transcriptLines: turns,
      })
    : undefined

  const artifacts: PostCallArtifacts = {
    routing,
    disposition,
    summary,
    sentiment,
    objectionTags,
    escalationHandoff,
    entities: {
      phones: normalizedCaller ? [normalizedCaller, ...phones.filter((p) => p !== normalizedCaller)] : phones,
      emails,
      turnCount: turns.length,
    },
    recording,
    crm: crmMeta,
  }

  const priorMeta =
    session.metadataJson && typeof session.metadataJson === 'object' && !Array.isArray(session.metadataJson)
      ? (session.metadataJson as Record<string, unknown>)
      : {}

  await input.prisma.voiceDemoSession.update({
    where: { id: session.id },
    data: {
      status: 'ended',
      endedAt: new Date(),
      outcomeCode: disposition,
      metadataJson: {
        ...priorMeta,
        postCall: artifacts,
        bargeInCount: input.bargeInCount ?? priorMeta.bargeInCount,
      },
    },
  })

  await emitPostCallVoiceEvents(
    {
      tenantId: input.tenantId,
      agentId: input.agentId,
      sessionId: input.sessionId,
      routing,
      disposition,
      summary,
      sentiment: sentiment.sentiment,
      objectionTags,
      escalationHandoff,
    },
    { prisma: input.prisma },
  )

  void recordSessionComplianceCloseout(input.prisma, {
    tenantId: input.tenantId,
    agentId: input.agentId,
    sessionId: input.sessionId,
    channel: 'browser_live',
    hasRecording: Boolean(recording?.data),
    transcriptTurnCount: turns.length,
  })

  return artifacts
}
