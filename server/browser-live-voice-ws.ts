#!/usr/bin/env node
/**
 * Browser live voice WebSocket sidecar (M1).
 * Always-on — do not deploy to Vercel serverless.
 *
 * Usage: npm run dev:browser-live-ws
 * Env: VOICE_LIVE_WS_PORT (default 3002), JWT_SECRET, DATABASE_URL, GROQ_API_KEY
 * Stub: BROWSER_LIVE_STUB=1 — echo-style replies without Groq
 */

import { config } from 'dotenv'
import { resolve } from 'path'

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
import { trainingPackVersionForAgent } from '../lib/voice-agent/training-pack-load'

const PORT = parseInt(process.env.PORT || process.env.VOICE_LIVE_WS_PORT || '3002', 10)
const HOST = process.env.HOST || '0.0.0.0'
const JWT_SECRET = (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'change-me-in-production').trim()
const STUB_MODE = process.env.BROWSER_LIVE_STUB === '1'

type ConnectionState = {
  ws: WebSocket
  tenantId: string
  userId: string
  sessionId: string | null
  agentId: string | null
  activeTurnId: string | null
  turnAbort: AbortController | null
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

  try {
    const result = await runBrowserLiveTurn({
      prisma,
      tenantId: state.tenantId,
      agentId: state.agentId,
      sessionId: state.sessionId,
      userText: text,
      signal: controller.signal,
      stubMode: STUB_MODE,
    })

    if (controller.signal.aborted || state.activeTurnId !== turnId) {
      send(state.ws, { type: 'turn.cancelled', turnId, reason: 'interrupt' })
      return
    }

    send(state.ws, { type: 'agent.text', text: result.agentText, turnId })

    if (result.audioBase64) {
      send(state.ws, {
        type: 'agent.audio.chunk',
        turnId,
        seq: 0,
        mime: result.audioMime,
        data: result.audioBase64,
      })
    }

    send(state.ws, { type: 'turn.complete', turnId })
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

async function startSession(
  state: ConnectionState,
  agentId: string,
  tenantId: string,
) {
  try {
    const effectiveTenantId = state.tenantId || tenantId
    const agent = await prisma.voiceAgent.findFirst({
      where: { id: agentId, tenantId: effectiveTenantId, status: 'active' },
    })
    if (!agent) {
      send(state.ws, { type: 'error', message: 'Agent not found', code: 'AGENT_NOT_FOUND' })
      return
    }

    const trainingVersion = await trainingPackVersionForAgent(agentId, effectiveTenantId)
    const session = await prisma.voiceDemoSession.create({
      data: {
        tenantId: effectiveTenantId,
        voiceAgentId: agentId,
        trainingPackVersionAtStart: trainingVersion,
        channel: 'browser_live',
        status: 'active',
        transcriptJson: [],
        metadataJson: { source: 'browser-live-ws', stubMode: STUB_MODE },
      },
    })

    state.sessionId = session.id
    state.agentId = agentId

    send(state.ws, {
      type: 'session.ready',
      sessionId: session.id,
      agentId,
      stubMode: STUB_MODE,
    })
  } catch (e) {
    console.error('[browser-live-ws] session.start error', e)
    send(state.ws, {
      type: 'error',
      message: e instanceof Error ? e.message : 'Failed to start session',
      code: 'SESSION_FAILED',
    })
  }
}

async function endSession(state: ConnectionState) {
  cancelActiveTurn(state, 'superseded')
  if (state.sessionId) {
    await prisma.voiceDemoSession.updateMany({
      where: { id: state.sessionId, status: 'active' },
      data: { status: 'ended', endedAt: new Date() },
    })
  }
  state.sessionId = null
  state.agentId = null
}

function handleMessage(state: ConnectionState, msg: BrowserLiveClientMessage) {
  switch (msg.type) {
    case 'ping':
      send(state.ws, { type: 'pong' })
      break
    case 'session.start':
      void startSession(state, msg.agentId, msg.tenantId)
      break
    case 'session.end':
      void endSession(state)
      break
    case 'interrupt':
      cancelActiveTurn(state, 'interrupt')
      break
    case 'speech.started':
      if (state.activeTurnId) {
        cancelActiveTurn(state, 'interrupt')
      }
      break
    case 'utterance.final':
      void handleUtterance(state, msg.text.trim(), msg.turnId)
      break
    case 'speech.stopped':
      break
    default:
      break
  }
}

const httpServer = createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, service: 'browser-live-voice-ws', stubMode: STUB_MODE }))
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
    }),
  )
})

wss.on('connection', (ws, req) => {
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
    activeTurnId: null,
    turnAbort: null,
  }

  ws.on('message', (raw) => {
    const msg = parseBrowserLiveClientMessage(raw.toString())
    if (!msg) {
      send(ws, { type: 'error', message: 'Invalid message', code: 'BAD_JSON' })
      return
    }
    handleMessage(state, msg)
  })

  ws.on('close', () => {
    void endSession(state)
  })
})
