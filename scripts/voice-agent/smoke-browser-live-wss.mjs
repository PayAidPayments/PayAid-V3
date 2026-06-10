#!/usr/bin/env node
/**
 * Smoke test browser-live WSS sidecar (stub or offline-real).
 * Usage:
 *   npm run dev:browser-live-ws   # terminal A
 *   npm run voice-agent:smoke-browser-live-wss
 */
import WebSocket from 'ws'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

function jwtSecret() {
  return (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '').trim()
}

const tokenArg =
  process.argv.find((a) => a.startsWith('--token='))?.split('=').slice(1).join('=') ||
  process.env.SMOKE_AUTH_TOKEN
const wsBase = (process.env.NEXT_PUBLIC_VOICE_LIVE_WS_URL || 'ws://127.0.0.1:3002').replace(/\/$/, '')
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'

const SESSION_READY_MS = Number(process.env.BROWSER_LIVE_SMOKE_SESSION_MS || 120_000)
const TURN_COMPLETE_MS = Number(process.env.BROWSER_LIVE_SMOKE_TURN_MS || 180_000)

if (!tokenArg) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error:
          'JWT required — pass --token=… or set SMOKE_AUTH_TOKEN (npm run voice-agent:mint-validation-auth-token)',
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const url = `${wsBase}/?token=${encodeURIComponent(tokenArg)}`

function findPastEvent(events, predicate) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (predicate(events[i])) return events[i]
  }
  return null
}

function attachEventBuffer(ws, events) {
  ws.on('message', (raw) => {
    try {
      events.push(JSON.parse(String(raw)))
    } catch {
      /* ignore */
    }
  })
}

function waitFor(ws, events, predicate, timeoutMs, step) {
  const past = findPastEvent(events, predicate)
  if (past) return Promise.resolve(past)

  return new Promise((resolve, reject) => {
    let poll = null
    const eventSummary = () => {
      const types = [...new Set(events.map((e) => e.type))]
      return types.length ? types.join(',') : 'none'
    }

    const cleanup = () => {
      clearTimeout(timer)
      if (poll) clearInterval(poll)
      ws.off('message', onMsg)
    }

    const tryResolve = () => {
      const match = findPastEvent(events, predicate)
      if (match) {
        cleanup()
        resolve(match)
        return true
      }
      const fatal = findPastEvent(events, (m) => m.type === 'error' && m.code !== 'TTS_PARTIAL')
      if (fatal) {
        cleanup()
        reject(
          new Error(
            `${step}: ${fatal.message || 'sidecar error'} [saw: ${eventSummary()}]`,
          ),
        )
        return true
      }
      return false
    }

    const onMsg = () => {
      tryResolve()
    }

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`${step}: timeout after ${timeoutMs}ms [saw: ${eventSummary()}]`))
    }, timeoutMs)

    ws.on('message', onMsg)
    poll = setInterval(tryResolve, 50)
    tryResolve()
  })
}

const ws = new WebSocket(url)
const events = []
attachEventBuffer(ws, events)

ws.on('close', (code, reason) => {
  console.error(JSON.stringify({ event: 'ws_close', code, reason: reason.toString() }))
})

await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('ws_open: timeout after 120000ms')), 120_000)
  ws.once('open', () => {
    clearTimeout(timer)
    resolve()
  })
  ws.once('error', (err) => {
    clearTimeout(timer)
    reject(err)
  })
})

ws.send(JSON.stringify({ type: 'session.start', agentId, tenantId }))
const ready = await waitFor(
  ws,
  events,
  (m) => m.type === 'session.ready',
  SESSION_READY_MS,
  'session.ready',
)

const turnId = `smoke-${Date.now()}`
ws.send(
  JSON.stringify({
    type: 'utterance.final',
    text: 'Say hello in one short sentence.',
    turnId,
  }),
)
await waitFor(
  ws,
  events,
  (m) => m.type === 'turn.complete' && m.turnId === turnId,
  TURN_COMPLETE_MS,
  'turn.complete',
)
ws.send(JSON.stringify({ type: 'session.end' }))
ws.close()

console.log(
  JSON.stringify(
    {
      ok: true,
      wsBase,
      sessionId: ready.sessionId,
      offlineReal: !!ready.offlineReal,
      eventTypes: events.map((e) => e.type),
      agentText: events.find((e) => e.type === 'agent.text')?.text?.slice(0, 120) || null,
    },
    null,
    2,
  ),
)
