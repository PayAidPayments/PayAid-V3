/**

 * Shared turn handler for browser live voice (sidecar only — not used by BrowserDemoV1 HTTP routes).

 */



import type { PrismaClient } from '@prisma/client'

import { generateVoiceResponse, isGroqConfigured } from '@/lib/voice-agent/llm'

import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'

import { buildMergedSystemContext } from '@/lib/voice-agent/agent-runtime-context'

import { loadApprovedTrainingSnapshot } from '@/lib/voice-agent/training-pack-load'

import {
  maxTokensForVerbosity,
  mergeVoiceBehaviorOverride,
  parseVoiceBehaviorFromWorkflow,
  type VoiceBehaviorConfig,
} from '@/lib/voice-agent/voice-behavior-config'

import { parseTranscriptJson, type DemoTranscriptTurn } from '@/lib/voice-agent/demo-transcript'

import { streamTtsForText } from '@/lib/voice-agent/browser-live/tts-stream'
import { processBrowserLiveToolIntent, type BrowserLiveToolTurnOutcome } from '@/lib/voice-agent/browser-live/turn-tools'
import {
  assessVoiceAgentOutput,
  assessVoiceUserInput,
  isVoiceGuardrailsEnabled,
  voiceGuardrailSafeInputResponse,
} from '@/lib/voice-agent/security/voice-guardrails'



export type LiveTurnResult = {

  userText: string

  agentText: string

  audioChunkCount: number

  audioMime: string

  ttsError?: string

  toolOutcome?: BrowserLiveToolTurnOutcome | null

}



export type LiveTurnAudioChunk = {

  seq: number

  data: string

  mime: string

}



export type LiveTurnOptions = {

  prisma: PrismaClient

  tenantId: string

  agentId: string

  sessionId: string

  userText: string

  signal?: AbortSignal

  stubMode?: boolean

  /** Stream TTS sentence chunks (real voice path). */
  onAudioChunk?: (chunk: LiveTurnAudioChunk) => void | Promise<void>
  /** Demo UI override for tone/pace/verbosity (session-scoped). */
  voiceBehaviorOverride?: Partial<
    Pick<VoiceBehaviorConfig, 'tonePreset' | 'pacePreset' | 'verbosityPreset'>
  >
}



export async function runBrowserLiveTurn(opts: LiveTurnOptions): Promise<LiveTurnResult> {

  const {
    prisma,
    tenantId,
    agentId,
    sessionId,
    userText,
    signal,
    stubMode,
    onAudioChunk,
    voiceBehaviorOverride,
  } = opts



  if (signal?.aborted) {

    throw new DOMException('Turn aborted', 'AbortError')

  }



  if (stubMode) {

    const agentText = `Thanks for saying "${userText.slice(0, 80)}". This is a live voice stub — full Groq + TTS runs when BROWSER_LIVE_STUB is off.`

    return {

      userText,

      agentText,

      audioChunkCount: 0,

      audioMime: 'audio/wav',

      ttsError: 'stub_mode_no_tts',

    }

  }



  const agent = await prisma.voiceAgent.findFirst({

    where: { id: agentId, tenantId, status: 'active' },

  })

  if (!agent) {

    throw new Error('Agent not found')

  }



  const session = await prisma.voiceDemoSession.findFirst({

    where: { id: sessionId, voiceAgentId: agentId, tenantId, status: 'active' },

  })

  if (!session) {

    throw new Error('Session not found')

  }



  if (!isGroqConfigured()) {

    throw new Error('GROQ_API_KEY is not configured on the live voice sidecar')

  }



  let context = ''

  try {

    const kbResults = await searchKnowledgeBase(agentId, userText, 3)

    if (kbResults?.length) context = kbResults.map((r) => r.content).join('\n\n')

  } catch {

    /* ignore */

  }



  const approved = await loadApprovedTrainingSnapshot(agentId, tenantId, prisma)
  const baseVoiceBehavior = parseVoiceBehaviorFromWorkflow(agent.workflow)
  const voiceBehavior = mergeVoiceBehaviorOverride(baseVoiceBehavior, voiceBehaviorOverride)
  const effectiveWorkflow =
    voiceBehaviorOverride && agent.workflow && typeof agent.workflow === 'object'
      ? { ...(agent.workflow as Record<string, unknown>), voiceBehavior }
      : voiceBehaviorOverride
        ? { voiceBehavior }
        : agent.workflow

  const systemPrompt = buildMergedSystemContext(
    {
      id: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      description: agent.description,
      language: agent.language,
      voiceTone: agent.voiceTone,
      systemPrompt: agent.systemPrompt,
      workflow: effectiveWorkflow,
      knowledgeBase: agent.knowledgeBase,
      functions: agent.functions,
      compliance: agent.compliance,
    },
    { kbContext: context, trainingPackApproved: approved },
  )



  let effectiveUserText = userText
  if (isVoiceGuardrailsEnabled()) {
    const inputCheck = assessVoiceUserInput(userText, 'browser_live')
    effectiveUserText = inputCheck.sanitized
    if (inputCheck.blocked) {
      return {
        userText: effectiveUserText,
        agentText: voiceGuardrailSafeInputResponse(),
        audioChunkCount: 0,
        audioMime: 'audio/wav',
        ttsError: 'guardrail_input_blocked',
      }
    }
  }

  const transcript = parseTranscriptJson(session.transcriptJson)

  const history = transcript.map((t) => ({ role: t.role, content: t.content }))

  history.push({ role: 'user', content: effectiveUserText })

  if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')



  let agentText = await generateVoiceResponse(systemPrompt, history, agent.language, {

    maxTokens: maxTokensForVerbosity(voiceBehavior.verbosityPreset),

  })

  if (isVoiceGuardrailsEnabled()) {
    const outputCheck = assessVoiceAgentOutput(agentText)
    agentText = outputCheck.sanitized
  }

  let toolOutcome: BrowserLiveToolTurnOutcome | null = null
  if (!isEphemeralBrowserLiveSession(sessionId)) {
    toolOutcome = await processBrowserLiveToolIntent({
      userText: effectiveUserText,
      callerPhone: readCallerPhoneFromSession(session),
      functions: agent.functions,
      tenantId,
      agentId,
      sessionId,
      prisma,
    })
  }

  if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')



  const now = new Date().toISOString()

  const nextTranscript: DemoTranscriptTurn[] = [

    ...transcript,

    { role: 'user', content: userText, timestamp: now },

    { role: 'assistant', content: agentText, timestamp: now },

  ]



  await prisma.voiceDemoSession.update({

    where: { id: sessionId },

    data: { transcriptJson: nextTranscript },

  })



  let audioChunkCount = 0

  let audioMime = 'audio/wav'

  let ttsError: string | undefined



  if (onAudioChunk && agentText.trim()) {

    const streamed = await streamTtsForText({

      text: agentText.slice(0, 2000),

      language: agent.language || 'en',

      voiceId: agent.voiceId,

      voiceTone: agent.voiceTone,

      voiceBehavior,

      signal,

      onChunk: async (chunk) => {

        audioMime = chunk.mime

        await onAudioChunk({

          seq: chunk.seq,

          data: chunk.audioBase64,

          mime: chunk.mime,

        })

      },

    })

    audioChunkCount = streamed.chunkCount

    ttsError = streamed.ttsError

  }



  if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')



  return { userText, agentText, audioChunkCount, audioMime, ttsError, toolOutcome }

}

function isEphemeralBrowserLiveSession(sessionId: string): boolean {
  return sessionId.startsWith('stub_') || sessionId.startsWith('offline_')
}

function readCallerPhoneFromSession(session: { metadataJson: unknown }): string | null {
  const meta = session.metadataJson
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const phone = (meta as Record<string, unknown>).callerPhone
    return typeof phone === 'string' ? phone : null
  }
  return null
}


