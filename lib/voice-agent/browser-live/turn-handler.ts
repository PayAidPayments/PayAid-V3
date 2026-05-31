/**
 * Shared turn handler for browser live voice (sidecar only — not used by BrowserDemoV1 HTTP routes).
 */

import type { PrismaClient } from '@prisma/client'
import { generateVoiceResponse, isGroqConfigured } from '@/lib/voice-agent/llm'
import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'
import { buildMergedSystemContext } from '@/lib/voice-agent/agent-runtime-context'
import { loadApprovedTrainingSnapshot } from '@/lib/voice-agent/training-pack-load'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'
import {
  maxTokensForVerbosity,
  parseVoiceBehaviorFromWorkflow,
} from '@/lib/voice-agent/voice-behavior-config'
import { parseTranscriptJson, type DemoTranscriptTurn } from '@/lib/voice-agent/demo-transcript'

export type LiveTurnResult = {
  userText: string
  agentText: string
  audioBase64: string | null
  audioMime: string
  ttsError?: string
}

export type LiveTurnOptions = {
  prisma: PrismaClient
  tenantId: string
  agentId: string
  sessionId: string
  userText: string
  signal?: AbortSignal
  stubMode?: boolean
}

export async function runBrowserLiveTurn(opts: LiveTurnOptions): Promise<LiveTurnResult> {
  const { prisma, tenantId, agentId, sessionId, userText, signal, stubMode } = opts

  if (signal?.aborted) {
    throw new DOMException('Turn aborted', 'AbortError')
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

  if (stubMode) {
    const agentText = `Thanks for saying "${userText.slice(0, 80)}". This is a live voice stub — full Groq + TTS runs when BROWSER_LIVE_STUB is off.`
    return {
      userText,
      agentText,
      audioBase64: null,
      audioMime: 'audio/wav',
      ttsError: 'stub_mode_no_tts',
    }
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

  const approved = await loadApprovedTrainingSnapshot(agentId, tenantId)
  const systemPrompt = buildMergedSystemContext(
    {
      id: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      description: agent.description,
      language: agent.language,
      voiceTone: agent.voiceTone,
      systemPrompt: agent.systemPrompt,
      workflow: agent.workflow,
      knowledgeBase: agent.knowledgeBase,
      functions: agent.functions,
      compliance: agent.compliance,
    },
    { kbContext: context, trainingPackApproved: approved },
  )

  const transcript = parseTranscriptJson(session.transcriptJson)
  const history = transcript.map((t) => ({ role: t.role, content: t.content }))
  history.push({ role: 'user', content: userText })
  const voiceBehavior = parseVoiceBehaviorFromWorkflow(agent.workflow)

  if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')

  const agentText = await generateVoiceResponse(systemPrompt, history, agent.language, {
    maxTokens: maxTokensForVerbosity(voiceBehavior.verbosityPreset),
  })

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

  let audioBase64: string | null = null
  let audioMime = 'audio/wav'
  let ttsError: string | undefined
  try {
    const pace =
      voiceBehavior.pacePreset === 'slow' ? 0.9 : voiceBehavior.pacePreset === 'fast' ? 1.1 : 1.0
    const tts = await synthesizeSpeech(
      agentText.slice(0, 500),
      agent.language || 'en',
      agent.voiceId ?? undefined,
      pace,
      { voiceTone: agent.voiceTone },
    )
    if (tts) {
      audioBase64 = Buffer.from(tts).toString('base64')
    }
  } catch (e) {
    ttsError = e instanceof Error ? e.message : String(e)
  }

  if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')

  return { userText, agentText, audioBase64, audioMime, ttsError }
}
