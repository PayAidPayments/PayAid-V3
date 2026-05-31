#!/usr/bin/env node
/**
 * Smoke test browser-live WSS sidecar (stub mode friendly).
 * Usage:
 *   BROWSER_LIVE_STUB=1 npm run dev:browser-live-ws   # terminal A
 *   node scripts/voice-agent/smoke-browser-live-wss.mjs --token <jwt>
 */
import WebSocket from 'ws'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const tokenArg = process.argv.find((a) => a.startsWith('--token='))?.split('=').slice(1).join('=')
  || process.env.SMOKE_AUTH_TOKEN
const wsBase = (process.env.NEXT_PUBLIC_VOICE_LIVE_WS_URL || 'ws://127.0.0.1:3002').replace(/\/$/, '')
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const tenantId = process.env.SMOKE_TENANT_ID || 'tenant_demo'

if (!tokenArg) {
  console.error(JSON.stringify({
    ok: false,
    error: 'JWT required — pass --token=… or set SMOKE_AUTH_TOKEN (npm run voice-agent:mint-validation-auth-token)',
  }, null, 2))
  process.exit(1)
}

const url = `${wsBase}/?token=${encodeURIComponent(tokenArg)}`

function waitFor(ws, type, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeoutMs)
    const onMsg = (raw) => {
      let msg
      try {
        msg = JSON.parse(String(raw))
      } catch {
        return
      }
      if (msg.type === type) {
        clearTimeout(timer)
        ws.off('message', onMsg)
        resolve(msg)
      }
      if (msg.type === 'error') {
        clearTimeout(timer)
        ws.off('message', onMsg)
        reject(new Error(msg.message || 'sidecar error'))
      }
    }
    ws.on('message', onMsg)
  })
}

const ws = new WebSocket(url)
const events = []

ws.on('message', (raw) => {
  try {
    events.push(JSON.parse(String(raw)))
  } catch {
    /* ignore */
  }
})

await new Promise((resolve, reject) => {
  ws.once('open', resolve)
  ws.once('error', reject)
})

const readyPromise = waitFor(ws, 'session.ready')
ws.send(JSON.stringify({ type: 'session.start', agentId, tenantId }))
const ready = await readyPromise
const turnId = `smoke-${Date.now()}`
ws.send(JSON.stringify({ type: 'utterance.final', text: 'Hello, smoke test', turnId }))
await waitFor(ws, 'turn.complete', 30000)
ws.send(JSON.stringify({ type: 'session.end' }))
ws.close()

console.log(JSON.stringify({
  ok: true,
  wsBase,
  sessionId: ready.sessionId,
  eventTypes: events.map((e) => e.type),
  agentText: events.find((e) => e.type === 'agent.text')?.text?.slice(0, 120) || null,
}, null, 2))
