#!/usr/bin/env node
/**
 * Spoken escalation path: manager handoff utterance → transfer.initiated + post-call escalation.
 */
import WebSocket from 'ws'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
if (!process.env.VOICE_SUPERVISOR_PHONE?.trim()) {
  process.env.VOICE_SUPERVISOR_PHONE = '+919876543210'
}

const wsBase = (process.env.NEXT_PUBLIC_VOICE_LIVE_WS_URL || 'ws://127.0.0.1:3002').replace(/\/$/, '')
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const token = process.env.SMOKE_AUTH_TOKEN || process.argv.find((a) => a.startsWith('--token='))?.split('=').slice(1).join('=')

if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'SMOKE_AUTH_TOKEN required' }))
  process.exit(1)
}

function waitFor(ws, events, pred, ms, step) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${step} timeout`)), ms)
    const check = () => {
      const m = [...events].reverse().find(pred)
      if (m) {
        clearTimeout(t)
        resolve(m)
      }
    }
    ws.on('message', () => check())
    check()
  })
}

const ws = new WebSocket(`${wsBase}/?token=${encodeURIComponent(token)}`)
const events = []
ws.on('message', (raw) => {
  try {
    events.push(JSON.parse(String(raw)))
  } catch {
    /* ignore */
  }
})

await new Promise((res, rej) => {
  ws.once('open', res)
  ws.once('error', rej)
})

const callerPhone = `9${String(Date.now()).slice(-9)}`
ws.send(
  JSON.stringify({
    type: 'session.start',
    agentId,
    tenantId,
    callerPhone,
    crmWritebackEnabled: true,
  }),
)
const ready = await waitFor(ws, events, (m) => m.type === 'session.ready', 120_000, 'session.ready')
if (ready.offlineReal) throw new Error('offlineReal session — DB required')

const turnId = `esc-${Date.now()}`
ws.send(
  JSON.stringify({
    type: 'utterance.final',
    text: 'This is too expensive. Talk to my manager please.',
    turnId,
  }),
)
await waitFor(ws, events, (m) => m.type === 'turn.complete' && m.turnId === turnId, 180_000, 'turn.complete')

const transfer = events.find((m) => m.type === 'transfer.initiated')
if (!transfer) throw new Error('expected transfer.initiated')

ws.send(JSON.stringify({ type: 'session.end' }))
const ended = await waitFor(ws, events, (m) => m.type === 'session.ended', 60_000, 'session.ended')
ws.close()

const tags = ended.artifacts?.objectionTags || []
if (!tags.includes('escalation_request')) throw new Error('expected escalation_request tag')

console.log(
  JSON.stringify({
    ok: true,
    sessionId: ready.sessionId,
    transferMode: transfer.mode,
    objectionTags: tags,
    escalationHandoff: !!ended.artifacts,
  }),
)
