#!/usr/bin/env node
/**
 * Browser live voice WebSocket sidecar (M1).
 * Always-on — do not deploy to Vercel serverless.
 *
 * Usage: npm run dev:browser-live-ws
 * Env: VOICE_LIVE_WS_PORT (default 3002), JWT_SECRET, DATABASE_URL, GROQ_API_KEY
 * Stub: BROWSER_LIVE_STUB=1 — echo-style replies without Groq
 * Real voice: GROQ_API_KEY + DATABASE_URL + TTS (COQUI_TTS_URL / gateway)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { randomBytes } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local'), override: false })
config({ path: resolve(process.cwd(), '.env'), override: false })

import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { verify } from 'jsonwebtoken'
import { prisma } from './db-prisma'
import {
  parseBrowserLiveClientMessage,
  type BrowserLiveClientMessage,
} from '../lib/voice-agent/browser-live/protocol'
import { runBrowserLiveTurn } from '../lib/voice-agent/browser-live/turn-handler'
import { transcribeBrowserLiveAudio } from '../lib/voice-agent/browser-live/server-stt'
import {
  assessSttSafety,
  isSttLowConfidenceRailEnabled,
} from '../lib/voice-agent/browser-live/stt-safety'
import {
  incrementBrowserLiveTurnsCompleted,
  recordBrowserLiveBargeIn,
} from '../lib/voice-agent/browser-live/session-metrics'
import { trainingPackVersionForAgent } from '../lib/voice-agent/training-pack-load'
import { getOfflineSmokeAgent } from '../lib/voice-agent/browser-live/offline-agent-config'
import type { OfflineVoiceAgentConfig } from '../lib/voice-agent/browser-live/offline-agent-config'
import {
  clearOfflineTranscript,
  getOfflineTranscript,
  runBrowserLiveTurnOffline,
} from '../lib/voice-agent/browser-live/turn-handler-offline'
import { buildOfflinePostCallArtifacts } from '../lib/voice-agent/browser-live/offline-post-call'
import { probeTtsHealth } from '../lib/voice-agent/tts'
import { finalizeBrowserLiveSession } from '../lib/voice-agent/browser-live/post-call-pipeline'
import { recordBrowserLiveRuntimeComplianceStart } from '../lib/voice-agent/runtime-compliance'
import type { BrowserLiveVoiceBehaviorOverride } from '../lib/voice-agent/browser-live/protocol'
import {
  emitBrowserLiveWireEvent,
  emitVoiceEventDirect,
} from '../lib/voice-agent/browser-live/voice-event-bridge'
import {
  initiateInCallTransfer,
  userRequestsEscalation,
} from '../lib/voice-agent/in-call-transfer'

const PORT = parseInt(process.env.PORT || process.env.VOICE_LIVE_WS_PORT || '3002', 10)
const HOST = process.env.HOST || '0.0.0.0'
const JWT_SECRET = (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'change-me-in-production').trim()
const STUB_MODE = process.env.BROWSER_LIVE_STUB === '1'
const OFFLINE_REAL = process.env.BROWSER_LIVE_OFFLINE_REAL === '1'
let ttsProbeCache:
  | { ts: number; payload: { ok: boolean; provider: string; successCount: number; attempts: number; lastError?: string } }
  | null = null

type ConnectionState = {
  ws: WebSocket
  tenantId: string
  userId: string
  sessionId: string | null
  agentId: string | null
  agentLanguage: string | null
  offlineAgent: OfflineVoiceAgentConfig | null
  activeTurnId: string | null
  turnAbort: AbortController | null
  bargeInCount: number
  callerPhone: string | null
  crmWritebackEnabled: boolean
  voiceBehaviorOverride: BrowserLiveVoiceBehaviorOverride | null
}

async function withDbRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      const msg = e instanceof Error ? e.message : String(e)
      const retryable =
        msg.includes("Can't reach database server") ||
        msg.includes('Connection timed out') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('P1001')
      if (!retryable || i === attempts - 1) throw e
      console.warn(`[browser-live-ws] ${label} DB retry ${i + 1}/${attempts - 1}: ${msg.slice(0, 120)}`)
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
    }
  }
  throw lastError
}

function isEphemeralSession(sessionId: string | null) {
  return !!sessionId && (sessionId.startsWith('stub_') || sessionId.startsWith('offline_'))
}

function createSessionId(prefix: 'offline' | 'stub') {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString('hex')}`
}

function startOfflineRealSession(state: ConnectionState, agentId: string, tenantId: string) {
  const effectiveTenantId = state.tenantId || tenantId
  const agent = getOfflineSmokeAgent(agentId, effectiveTenantId)
  const sessionId = createSessionId('offline')
  state.sessionId = sessionId
  state.agentId = agentId
  state.agentLanguage = agent.language
  state.offlineAgent = agent
  send(state.ws, {
    type: 'session.ready',
    sessionId,
    agentId,
    stubMode: false,
    offlineReal: true,
  })
}

function send(ws: WebSocket, payload: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}

function cancelActiveTurn(state: ConnectionState, reason: 'interrupt' | 'superseded' | 'error') {
  if (state.turnAbort) {
    state.turnAbort.abort()
    state.turnAbort = null
  }
  if (state.activeTurnId) {
    send(state.ws, { type: 'turn.cancelled', turnId: state.activeTurnId, reason })
    state.activeTurnId = null
  }
}

async function acknowledgeInterrupt(
  state: ConnectionState,
  opts?: { cancelledTurnId?: string; msToSilence?: number },
) {
  let bargeInCount: number
  if (state.sessionId && !isEphemeralSession(state.sessionId)) {
    bargeInCount = await recordBrowserLiveBargeIn(prisma, state.sessionId, {
      msToSilence: opts?.msToSilence,
    })
  } else {
    state.bargeInCount += 1
    bargeInCount = state.bargeInCount
  }
  state.bargeInCount = bargeInCount
  send(state.ws, {
    type: 'interrupt.ack',
    bargeInCount,
    cancelledTurnId: opts?.cancelledTurnId,
    at: Date.now(),
  })
  void emitBrowserLiveWireEvent(
    'interrupt.ack',
    {
      tenantId: state.tenantId,
      agentId: state.agentId ?? undefined,
      sessionId: state.sessionId ?? undefined,
      meta: { bargeInCount, cancelledTurnId: opts?.cancelledTurnId },
    },
    { prisma },
  )
}

async function handleUtterance(
  state: ConnectionState,
  text: string,
  turnId: string,
) {
  if (!state.sessionId || !state.agentId) {
    send(state.ws, { type: 'error', message: 'Session not started', code: 'NO_SESSION' })
    return
  }

  cancelActiveTurn(state, 'superseded')

  const controller = new AbortController()
  state.turnAbort = controller
  state.activeTurnId = turnId

  send(state.ws, { type: 'transcript.final', text, turnId })

  const onAudioChunk = STUB_MODE
    ? undefined
    : async (chunk: { seq: number; mime: string; data: string }) => {
        if (controller.signal.aborted || state.activeTurnId !== turnId) return
        send(state.ws, {
          type: 'agent.audio.chunk',
          turnId,
          seq: chunk.seq,
          mime: chunk.mime,
          data: chunk.data,
        })
      }

  try {
    const result =
      state.offlineAgent && state.sessionId?.startsWith('offline_')
        ? await runBrowserLiveTurnOffline({
            sessionId: state.sessionId,
            agent: state.offlineAgent,
            userText: text,
            signal: controller.signal,
            onAudioChunk,
          })
        : await runBrowserLiveTurn({
            prisma,
            tenantId: state.tenantId,
            agentId: state.agentId,
            sessionId: state.sessionId,
            userText: text,
            signal: controller.signal,
            stubMode: STUB_MODE,
            onAudioChunk,
            voiceBehaviorOverride: state.voiceBehaviorOverride ?? undefined,
          })

    if (controller.signal.aborted || state.activeTurnId !== turnId) {
      send(state.ws, { type: 'turn.cancelled', turnId, reason: 'interrupt' })
      return
    }

    send(state.ws, { type: 'agent.text', text: result.agentText, turnId })

    if (result.audioChunkCount > 0) {
      send(state.ws, {
        type: 'agent.audio.chunk',
        turnId,
        seq: result.audioChunkCount,
        mime: result.audioMime,
        data: '',
        final: true,
      })
    }

    if (result.ttsError && !STUB_MODE) {
      send(state.ws, {
        type: 'error',
        message: `TTS partial failure: ${result.ttsError}`,
        code: 'TTS_PARTIAL',
      })
    }

    if (result.toolOutcome) {
      if (result.toolOutcome.draft) {
        send(state.ws, {
          type: 'tool.draft',
          turnId,
          toolName: result.toolOutcome.toolName,
          draft: (result.toolOutcome.result.result || {}) as Record<string, unknown>,
        })
      } else {
        send(state.ws, {
          type: 'tool.executed',
          turnId,
          toolName: result.toolOutcome.toolName,
          result: result.toolOutcome.result.result,
          error: result.toolOutcome.result.error,
        })
      }
    }

    if (
      userRequestsEscalation(text) &&
      state.sessionId &&
      !isEphemeralSession(state.sessionId)
    ) {
      try {
        const agent = await prisma.voiceAgent.findFirst({
          where: { id: state.agentId!, tenantId: state.tenantId },
          select: { phoneNumber: true },
        })
        const transfer = await initiateInCallTransfer(prisma, {
          tenantId: state.tenantId,
          agentId: state.agentId!,
          sessionId: state.sessionId,
          callerPhone: state.callerPhone,
          summary: text.slice(0, 500),
          fromPhone: agent?.phoneNumber,
        })
        if (transfer) {
          send(state.ws, {
            type: 'transfer.initiated',
            mode: transfer.mode,
            conferenceName: transfer.conferenceName,
            supervisorPhone: transfer.supervisorPhone,
          })
        }
      } catch (transferErr) {
        console.warn('[browser-live-ws] in-call transfer failed', transferErr)
      }
    }

    send(state.ws, { type: 'turn.complete', turnId })
    if (state.sessionId && !isEphemeralSession(state.sessionId)) {
      await incrementBrowserLiveTurnsCompleted(prisma, state.sessionId)
    }
  } catch (e) {
    if (controller.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
      send(state.ws, { type: 'turn.cancelled', turnId, reason: 'interrupt' })
      return
    }
    console.error('[browser-live-ws] turn error', e)
    send(state.ws, {
      type: 'error',
      message: e instanceof Error ? e.message : 'Turn failed',
      code: 'TURN_FAILED',
    })
    send(state.ws, { type: 'turn.cancelled', turnId, reason: 'error' })
  } finally {
    if (state.activeTurnId === turnId) {
      state.activeTurnId = null
      state.turnAbort = null
    }
  }
}

async function handleAudioUtterance(
  state: ConnectionState,
  msg: Extract<BrowserLiveClientMessage, { type: 'utterance.audio' }>,
) {
  if (!state.sessionId || !state.agentId) {
    send(state.ws, { type: 'error', message: 'Session not started', code: 'NO_SESSION' })
    return
  }

  let text = (msg.clientTextHint || '').trim()
  const audioBufLen = msg.data ? Buffer.from(msg.data.replace(/\s/g, ''), 'base64').byteLength : 0
  if (!STUB_MODE && msg.data) {
    try {
      const stt = await transcribeBrowserLiveAudio(
        msg.data,
        msg.mime,
        state.agentLanguage || undefined,
      )
      if (stt.text) text = stt.text

      const railOn = isSttLowConfidenceRailEnabled()
      const hasHint = !!(msg.clientTextHint || '').trim()
      const safety = assessSttSafety(stt.text, stt.audioBytes ?? audioBufLen)
      if (railOn && !hasHint && !safety.ok) {
        void emitVoiceEventDirect(
          'transcript.partial',
          {
            tenantId: state.tenantId,
            agentId: state.agentId ?? undefined,
            sessionId: state.sessionId ?? undefined,
            meta: {
              lowConfidence: true,
              confidence: safety.confidence,
              reason: safety.reason,
              turnId: msg.turnId,
            },
          },
          { prisma },
        )
        send(state.ws, {
          type: 'error',
          message: 'Could not hear you clearly. Please repeat your request.',
          code: 'STT_LOW_CONFIDENCE',
        })
        return
      }
    } catch (e) {
      console.error('[browser-live-ws] STT error', e)
      if (!text) {
        send(state.ws, {
          type: 'error',
          message: e instanceof Error ? e.message : 'Speech-to-text failed',
          code: 'STT_FAILED',
        })
        return
      }
    }
  }

  if (!text.trim()) {
    send(state.ws, { type: 'error', message: 'Empty transcript', code: 'EMPTY_UTTERANCE' })
    return
  }

  void emitVoiceEventDirect(
    'transcript.partial',
    {
      tenantId: state.tenantId,
      agentId: state.agentId ?? undefined,
      sessionId: state.sessionId ?? undefined,
      meta: {
        textPreview: text.trim().slice(0, 500),
        final: false,
        turnId: msg.turnId,
        channel: 'browser_live',
      },
    },
    { prisma },
  )

  await handleUtterance(state, text.trim(), msg.turnId)
}

async function startSession(
  state: ConnectionState,
  agentId: string,
  tenantId: string,
  opts?: {
    callerPhone?: string
    crmWritebackEnabled?: boolean
    voiceBehavior?: BrowserLiveVoiceBehaviorOverride
  },
) {
  state.callerPhone = opts?.callerPhone?.trim() || null
  state.crmWritebackEnabled = opts?.crmWritebackEnabled !== false
  state.voiceBehaviorOverride = opts?.voiceBehavior ?? null

  try {
    if (STUB_MODE) {
      const sessionId = createSessionId('stub')
      state.sessionId = sessionId
      state.agentId = agentId
      state.agentLanguage = 'en'
      state.offlineAgent = null
      send(state.ws, {
        type: 'session.ready',
        sessionId,
        agentId,
        stubMode: true,
      })
      return
    }

    if (OFFLINE_REAL && process.env.BROWSER_LIVE_PREFER_OFFLINE_REAL === '1') {
      startOfflineRealSession(state, agentId, tenantId)
      return
    }

    const effectiveTenantId = state.tenantId || tenantId
    const dbSession = await withDbRetry('session.start', async () => {
      const agent = await prisma.voiceAgent.findFirst({
        where: { id: agentId, tenantId: effectiveTenantId, status: 'active' },
      })
      if (!agent) return { error: 'AGENT_NOT_FOUND' as const }

      const trainingVersion = await trainingPackVersionForAgent(agentId, effectiveTenantId, prisma)
      const session = await prisma.voiceDemoSession.create({
        data: {
          tenantId: effectiveTenantId,
          voiceAgentId: agentId,
          trainingPackVersionAtStart: trainingVersion,
          channel: 'browser_live',
          status: 'active',
          transcriptJson: [],
          metadataJson: {
            source: 'browser-live-ws',
            stubMode: STUB_MODE,
            callerPhone: state.callerPhone,
            crmWritebackEnabled: state.crmWritebackEnabled,
            voiceBehaviorOverride: state.voiceBehaviorOverride,
          },
        },
      })
      return { agent, session }
    })

    if ('error' in dbSession && dbSession.error === 'AGENT_NOT_FOUND') {
      send(state.ws, { type: 'error', message: 'Agent not found', code: 'AGENT_NOT_FOUND' })
      return
    }

    const { agent, session } = dbSession as { agent: { language: string | null }; session: { id: string } }

    state.sessionId = session.id
    state.agentId = agentId
    state.agentLanguage = agent.language || 'en'
    state.offlineAgent = null
    state.bargeInCount = 0

    send(state.ws, {
      type: 'session.ready',
      sessionId: session.id,
      agentId,
      stubMode: false,
    })
    void recordBrowserLiveRuntimeComplianceStart(prisma, {
      tenantId: effectiveTenantId,
      agentId,
      sessionId: session.id,
      consentMode: 'implied_demo',
      crmWritebackEnabled: state.crmWritebackEnabled,
      callerPhone: state.callerPhone,
    })
    void emitBrowserLiveWireEvent(
      'session.ready',
      {
        tenantId: effectiveTenantId,
        agentId,
        sessionId: session.id,
        meta: { channel: 'browser_live' },
      },
      { prisma },
    )
  } catch (e) {
    console.error('[browser-live-ws] session.start error', e)
    if (OFFLINE_REAL) {
      console.warn('[browser-live-ws] falling back to offline real session (Groq, no DB)')
      startOfflineRealSession(state, agentId, tenantId)
      return
    }
    send(state.ws, {
      type: 'error',
      message: e instanceof Error ? e.message : 'Failed to start session',
      code: 'SESSION_FAILED',
    })
  }
}

async function endSession(
  state: ConnectionState,
  opts?: { recordingMime?: string; recordingData?: string },
) {
  cancelActiveTurn(state, 'superseded')
  const endedSessionId = state.sessionId
  const endedAgentId = state.agentId

  if (state.sessionId?.startsWith('offline_')) {
    const offlineId = state.sessionId
    const artifacts = buildOfflinePostCallArtifacts({
      transcript: getOfflineTranscript(offlineId),
      callerPhone: state.callerPhone,
      crmWritebackEnabled: state.crmWritebackEnabled,
      recordingMime: opts?.recordingMime,
      recordingData: opts?.recordingData,
      bargeInCount: state.bargeInCount,
    })
    clearOfflineTranscript(offlineId)
    send(state.ws, { type: 'session.ended', sessionId: offlineId, artifacts })
    void emitVoiceEventDirect('call.completed', {
      tenantId: state.tenantId,
      agentId: state.agentId ?? undefined,
      sessionId: offlineId,
      meta: { offlineReal: true, routing: artifacts.routing },
    })
    state.sessionId = null
    state.agentId = null
    state.offlineAgent = null
    state.agentLanguage = null
    state.callerPhone = null
    state.voiceBehaviorOverride = null
    state.bargeInCount = 0
    return
  }
  if (state.sessionId?.startsWith('stub_')) {
    state.sessionId = null
    state.agentId = null
    state.offlineAgent = null
    state.callerPhone = null
    state.voiceBehaviorOverride = null
    return
  }

  let artifacts = null
  if (endedSessionId && endedAgentId) {
    try {
      artifacts = await finalizeBrowserLiveSession({
        prisma,
        sessionId: endedSessionId,
        tenantId: state.tenantId,
        agentId: endedAgentId,
        callerPhone: state.callerPhone,
        crmWritebackEnabled: state.crmWritebackEnabled,
        recordingMime: opts?.recordingMime,
        recordingData: opts?.recordingData,
        bargeInCount: state.bargeInCount,
      })
    } catch (e) {
      console.error('[browser-live-ws] post-call finalize error', e)
      await prisma.voiceDemoSession.updateMany({
        where: { id: endedSessionId, status: 'active' },
        data: { status: 'ended', endedAt: new Date() },
      })
    }
    send(state.ws, {
      type: 'session.ended',
      sessionId: endedSessionId,
      artifacts: artifacts ?? undefined,
    })
    void emitBrowserLiveWireEvent(
      'session.ended',
      {
        tenantId: state.tenantId,
        agentId: endedAgentId,
        sessionId: endedSessionId,
        meta: {
          routing: artifacts?.routing,
          disposition: artifacts?.disposition,
          sentiment: artifacts?.sentiment?.sentiment,
        },
      },
      { prisma },
    )
  }

  state.sessionId = null
  state.agentId = null
  state.offlineAgent = null
  state.agentLanguage = null
  state.callerPhone = null
  state.voiceBehaviorOverride = null
  state.bargeInCount = 0
}

function handleMessage(state: ConnectionState, msg: BrowserLiveClientMessage) {
  switch (msg.type) {
    case 'ping':
      send(state.ws, { type: 'pong' })
      break
    case 'session.start':
      void startSession(state, msg.agentId, msg.tenantId, {
        callerPhone: msg.callerPhone,
        crmWritebackEnabled: msg.crmWritebackEnabled,
        voiceBehavior: msg.voiceBehavior,
      })
      break
    case 'session.end':
      void endSession(state, {
        recordingMime: msg.recordingMime,
        recordingData: msg.recordingData,
      })
      break
    case 'interrupt': {
      const cancelled = state.activeTurnId ?? undefined
      cancelActiveTurn(state, 'interrupt')
      void acknowledgeInterrupt(state, { cancelledTurnId: cancelled })
      break
    }
    case 'speech.started':
      if (state.activeTurnId) {
        const cancelled = state.activeTurnId
        cancelActiveTurn(state, 'interrupt')
        void acknowledgeInterrupt(state, { cancelledTurnId: cancelled })
      }
      break
    case 'utterance.final':
      void handleUtterance(state, msg.text.trim(), msg.turnId)
      break
    case 'utterance.audio':
      void handleAudioUtterance(state, msg)
      break
    case 'speech.stopped':
      break
    case 'transfer.request':
      void (async () => {
        if (!state.sessionId || !state.agentId || isEphemeralSession(state.sessionId)) {
          send(state.ws, { type: 'error', message: 'No active DB session', code: 'NO_SESSION' })
          return
        }
        try {
          const agent = await prisma.voiceAgent.findFirst({
            where: { id: state.agentId, tenantId: state.tenantId },
            select: { phoneNumber: true },
          })
          const transfer = await initiateInCallTransfer(prisma, {
            tenantId: state.tenantId,
            agentId: state.agentId,
            sessionId: state.sessionId,
            callerPhone: state.callerPhone,
            supervisorPhone: msg.supervisorPhone,
            fromPhone: agent?.phoneNumber,
          })
          if (!transfer) {
            send(state.ws, {
              type: 'error',
              message: 'Set VOICE_SUPERVISOR_PHONE or pass supervisorPhone',
              code: 'TRANSFER_UNAVAILABLE',
            })
            return
          }
          send(state.ws, {
            type: 'transfer.initiated',
            mode: transfer.mode,
            conferenceName: transfer.conferenceName,
            supervisorPhone: transfer.supervisorPhone,
          })
        } catch (e) {
          send(state.ws, {
            type: 'error',
            message: e instanceof Error ? e.message : 'Transfer failed',
            code: 'TRANSFER_FAILED',
          })
        }
      })()
      break
    default:
      break
  }
}

const httpServer = createServer((req, res) => {
  if (req.url === '/health/tts') {
    const now = Date.now()
    if (ttsProbeCache && now - ttsProbeCache.ts < 15_000) {
      res.writeHead(ttsProbeCache.payload.ok ? 200 : 503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(ttsProbeCache.payload))
      return
    }

    void probeTtsHealth(3, 'en')
      .then((p) => {
        const payload = { ...p }
        ttsProbeCache = { ts: Date.now(), payload }
        res.writeHead(payload.ok ? 200 : 503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(payload))
      })
      .catch((e) => {
        const payload = {
          ok: false,
          provider: (process.env.BROWSER_LIVE_TTS_PROVIDER || 'auto').trim().toLowerCase() || 'auto',
          successCount: 0,
          attempts: 3,
          lastError: e instanceof Error ? e.message : String(e),
        }
        ttsProbeCache = { ts: Date.now(), payload }
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(payload))
      })
    return
  }

  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        ok: true,
        service: 'browser-live-voice-ws',
        stubMode: STUB_MODE,
        offlineReal: OFFLINE_REAL,
      }),
    )
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server: httpServer })

httpServer.listen(PORT, HOST, () => {
  console.log(
    JSON.stringify({
      ok: true,
      service: 'browser-live-voice-ws',
      host: HOST,
      port: PORT,
      stubMode: STUB_MODE,
      offlineReal: OFFLINE_REAL,
    }),
  )
})

wss.on('connection', (ws, req) => {
  console.log('[browser-live-ws] connection', req.socket.remoteAddress)
  let url: URL
  try {
    url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
  } catch {
    ws.close(1002, 'Invalid URL')
    return
  }

  const token = url.searchParams.get('token')
  if (!token) {
    ws.close(1008, 'Authentication required')
    return
  }

  let tenantId: string
  let userId: string
  try {
    const decoded = verify(token, JWT_SECRET) as {
      userId?: string
      id?: string
      sub?: string
      tenantId?: string
      tenant_id?: string
    }
    userId = decoded.userId || decoded.id || decoded.sub || ''
    tenantId = decoded.tenantId || decoded.tenant_id || ''
    if (!userId || !tenantId) {
      ws.close(1008, 'Invalid token')
      return
    }
  } catch {
    ws.close(1008, 'Invalid token')
    return
  }

  const state: ConnectionState = {
    ws,
    tenantId,
    userId,
    sessionId: null,
    agentId: null,
    agentLanguage: null,
    offlineAgent: null,
    activeTurnId: null,
    turnAbort: null,
    bargeInCount: 0,
    callerPhone: null,
    crmWritebackEnabled: true,
    voiceBehaviorOverride: null,
  }

  ws.on('message', (raw) => {
    const msg = parseBrowserLiveClientMessage(raw.toString())
    if (!msg) {
      send(ws, { type: 'error', message: 'Invalid message', code: 'BAD_JSON' })
      return
    }
    if (msg.type === 'session.start' || msg.type === 'ping') {
      console.log('[browser-live-ws] message', msg.type, state.tenantId)
    }
    handleMessage(state, msg)
  })

  ws.on('close', () => {
    void endSession(state)
  })
})
