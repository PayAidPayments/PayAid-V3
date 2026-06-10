/**
 * Groq + TTS turn without Prisma (BROWSER_LIVE_OFFLINE_REAL sidecar path).
 */

import { generateVoiceResponse, isGroqConfigured } from '@/lib/voice-agent/llm'
import { buildMergedSystemContext } from '@/lib/voice-agent/agent-runtime-context'
import {
  maxTokensForVerbosity,
  parseVoiceBehaviorFromWorkflow,
} from '@/lib/voice-agent/voice-behavior-config'
import { streamTtsForText } from '@/lib/voice-agent/browser-live/tts-stream'
import type { OfflineVoiceAgentConfig } from '@/lib/voice-agent/browser-live/offline-agent-config'
import type { LiveTurnAudioChunk, LiveTurnResult } from '@/lib/voice-agent/browser-live/turn-handler'

const offlineTranscripts = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()

export type OfflineTurnOptions = {
  sessionId: string
  agent: OfflineVoiceAgentConfig
  userText: string
  signal?: AbortSignal
  onAudioChunk?: (chunk: LiveTurnAudioChunk) => void | Promise<void>
}

export async function runBrowserLiveTurnOffline(opts: OfflineTurnOptions): Promise<LiveTurnResult> {
  const { sessionId, agent, userText, signal, onAudioChunk } = opts

  if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')
  if (!isGroqConfigured()) {
    throw new Error('GROQ_API_KEY is not configured on the live voice sidecar')
  }

  const voiceBehavior = parseVoiceBehaviorFromWorkflow(agent.workflow)
  const systemPrompt = buildMergedSystemContext(agent, { kbContext: '', trainingPackApproved: null })

  const history = [...(offlineTranscripts.get(sessionId) || [])]
  history.push({ role: 'user', content: userText })

  if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')

  const agentText = await generateVoiceResponse(systemPrompt, history, agent.language, {
    maxTokens: maxTokensForVerbosity(voiceBehavior.verbosityPreset),
  })

  if (signal?.aborted) throw new DOMException('Turn aborted', 'AbortError')

  offlineTranscripts.set(sessionId, [
    ...history,
    { role: 'assistant', content: agentText },
  ])

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
        await onAudioChunk({ seq: chunk.seq, data: chunk.audioBase64, mime: chunk.mime })
      },
    })
    audioChunkCount = streamed.chunkCount
    ttsError = streamed.ttsError
  }

  return { userText, agentText, audioChunkCount, audioMime, ttsError }
}

export function clearOfflineTranscript(sessionId: string) {
  offlineTranscripts.delete(sessionId)
}

export function getOfflineTranscript(sessionId: string) {
  return offlineTranscripts.get(sessionId) ?? []
}
