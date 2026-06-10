#!/usr/bin/env node
/**
 * Real-mode browser-live evidence suite (sidecar must run WITHOUT BROWSER_LIVE_STUB=1).
 *
 * Usage:
 *   npm run dev:browser-live-ws          # terminal A — no stub
 *   npm run voice-agent:evidence-browser-live-real
 *
 * Env: SMOKE_AUTH_TOKEN or mint via voice-agent:mint-validation-auth-token
 *      SMOKE_TENANT_ID (default cmjptk2mw0000aocw31u48n64)
 *      SMOKE_AGENT_ID (default va_stage1_bolna_smoke)
 *      NEXT_PUBLIC_VOICE_LIVE_WS_URL or ws://127.0.0.1:3002
 */
import WebSocket from 'ws'
import dotenv from 'dotenv'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildLatencyEvidenceReport } from './lib/browser-live-latency-evidence.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const healthUrl =
  process.env.BROWSER_LIVE_HEALTH_URL ||
  `http://127.0.0.1:${process.env.VOICE_LIVE_WS_PORT || '3002'}/health`
const wsBase = (process.env.NEXT_PUBLIC_VOICE_LIVE_WS_URL || 'ws://127.0.0.1:3002').replace(
  /\/$/,
  '',
)
const token =
  process.env.SMOKE_AUTH_TOKEN ||
  process.argv.find((a) => a.startsWith('--token='))?.split('=').slice(1).join('=')
const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'

const blockers = []

async function checkHealth() {
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) })
    const body = await res.json()
    if (body.stubMode && !body.offlineReal) {
      blockers.push('Sidecar is in BROWSER_LIVE_STUB=1 mode — restart without stub for real evidence')
    }
    if (body.offlineReal) {
      console.error(JSON.stringify({ note: 'offline-real mode (Groq without DB)' }))
    }
    return body
  } catch (e) {
    blockers.push(`Sidecar health failed (${healthUrl}): ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}

function checkEnvBlockers() {
  if (!process.env.GROQ_API_KEY?.trim()) blockers.push('GROQ_API_KEY missing')
  const offlineReal =
    process.env.BROWSER_LIVE_OFFLINE_REAL === '1' ||
    process.env.BROWSER_LIVE_PREFER_OFFLINE_REAL === '1'
  if (!offlineReal && !process.env.DATABASE_URL?.trim()) {
    blockers.push('DATABASE_URL missing')
  }
  const db = process.env.DATABASE_URL || ''
  if (db.includes('@') && db.split('@').length > 2) {
    blockers.push('DATABASE_URL may be malformed (unescaped @ in password)')
  }
  const hasTts =
    process.env.COQUI_TTS_URL ||
    process.env.AI_GATEWAY_URL ||
    process.env.USE_AI_GATEWAY === 'true'
  if (!hasTts) {
    console.error(
      JSON.stringify({ warn: 'No TTS env — evidence will measure text + interrupt only' }),
    )
  }
}

const SESSION_READY_TIMEOUT_MS = Number(process.env.BROWSER_LIVE_EVIDENCE_SESSION_MS || 120_000)
const TURN_AGENT_TEXT_TIMEOUT_MS = Number(process.env.BROWSER_LIVE_EVIDENCE_TURN_MS || 180_000)
const TURN_COMPLETE_TIMEOUT_MS = Number(process.env.BROWSER_LIVE_EVIDENCE_COMPLETE_MS || 240_000)

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

function waitForEvent(ws, events, predicate, timeoutMs = 30_000, step = 'event') {
  const past = findPastEvent(events, predicate)
  if (past) return Promise.resolve(past)

  return new Promise((resolve, reject) => {
    let poll = null

    const cleanup = () => {
      clearTimeout(timer)
      if (poll) clearInterval(poll)
      ws.off('message', onMsg)
    }

    const eventSummary = () => {
      const types = [...new Set(events.map((e) => e.type))]
      return types.length ? types.join(',') : 'none'
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
            `${step}: sidecar error (${fatal.code || 'ERROR'}) — ${fatal.message || 'unknown'} [saw: ${eventSummary()}]`,
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
      reject(
        new Error(
          `${step}: timeout after ${timeoutMs}ms [saw: ${eventSummary()}]`,
        ),
      )
    }, timeoutMs)

    ws.on('message', onMsg)
    poll = setInterval(tryResolve, 50)
    tryResolve()
  })
}


async function runWsScenario() {
  if (!token) {
    blockers.push('SMOKE_AUTH_TOKEN required (npm run voice-agent:mint-validation-auth-token)')
    return null
  }

  const url = `${wsBase}/?token=${encodeURIComponent(token)}`
  const ws = new WebSocket(url)
  const serverEvents = []
  const timeline = []

  const mark = (label) => timeline.push({ at: Date.now(), label })

  attachEventBuffer(ws, serverEvents)
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
  mark('ws_open')
  console.error(JSON.stringify({ step: 'session.start' }))

  ws.send(JSON.stringify({ type: 'session.start', agentId, tenantId }))
  const ready = await waitForEvent(
    ws,
    serverEvents,
    (m) => m.type === 'session.ready',
    SESSION_READY_TIMEOUT_MS,
    'session.ready',
  )
  mark('session_ready')

  if (ready.stubMode) {
    blockers.push('session.ready reported stubMode:true')
  }

  const turn1 = `evidence-${Date.now()}`
  mark('turn1_utterance_sent')
  ws.send(
    JSON.stringify({
      type: 'utterance.final',
      text: 'Say hello in one short sentence.',
      turnId: turn1,
    }),
  )

  console.error(JSON.stringify({ step: 'turn1.agent_text' }))
  const agentText1 = await waitForEvent(
    ws,
    serverEvents,
    (m) => m.type === 'agent.text' && m.turnId === turn1,
    TURN_AGENT_TEXT_TIMEOUT_MS,
    'turn1.agent_text',
  )
  mark('turn1_agent_text')

  let gotAudio = false
  try {
    await waitForEvent(
      ws,
      serverEvents,
      (m) => m.type === 'agent.audio.chunk' && m.turnId === turn1 && m.data,
      25_000,
      'turn1.first_audio',
    )
    gotAudio = true
    mark('turn1_first_audio')
  } catch {
    if (process.env.COQUI_TTS_URL || process.env.AI_GATEWAY_URL) {
      blockers.push('No audio chunk within 25s on turn 1 (TTS missing or slow)')
    }
  }

  console.error(JSON.stringify({ step: 'turn1.complete' }))
  await waitForEvent(
    ws,
    serverEvents,
    (m) => m.type === 'turn.complete' && m.turnId === turn1,
    TURN_COMPLETE_TIMEOUT_MS,
    'turn1.complete',
  )
  mark('turn1_complete')

  const turn2 = `evidence-interrupt-${Date.now()}`
  ws.send(
    JSON.stringify({
      type: 'utterance.final',
      text: 'Name one PayAid service in one sentence.',
      turnId: turn2,
    }),
  )
  mark('turn2_utterance_sent')
  ws.send(JSON.stringify({ type: 'interrupt', turnId: turn2, at: Date.now() }))
  mark('turn2_interrupt_sent')
  console.error(JSON.stringify({ step: 'turn2.interrupt_ack' }))
  await waitForEvent(
    ws,
    serverEvents,
    (m) =>
      (m.type === 'turn.cancelled' && m.turnId === turn2) || m.type === 'interrupt.ack',
    15_000,
    'turn2.interrupt_ack',
  )
  mark('turn2_interrupt_ack_or_cancel')

  const turn3 = `evidence-recovery-${Date.now()}`
  mark('turn3_utterance_sent')
  ws.send(
    JSON.stringify({
      type: 'utterance.final',
      text: 'Thanks. What is the next step? One sentence.',
      turnId: turn3,
    }),
  )
  console.error(JSON.stringify({ step: 'turn3.complete' }))
  await waitForEvent(
    ws,
    serverEvents,
    (m) => m.type === 'turn.complete' && m.turnId === turn3,
    TURN_COMPLETE_TIMEOUT_MS,
    'turn3.complete',
  )
  mark('turn3_complete_recovery')

  ws.send(JSON.stringify({ type: 'session.end' }))
  ws.close()

  const speechStoppedAt = timeline.find((t) => t.label === 'turn1_utterance_sent')?.at
  const firstAudioAt = timeline.find((t) => t.label === 'turn1_first_audio')?.at
  const speechToAudioMs =
    speechStoppedAt && firstAudioAt ? firstAudioAt - speechStoppedAt : null

  const clientEvents = []
  if (speechToAudioMs != null) {
    clientEvents.push({
      at: speechStoppedAt,
      event: 'speech_stopped',
      turnId: turn1,
    })
    clientEvents.push({
      at: firstAudioAt,
      event: 'audio_first_byte',
      turnId: turn1,
    })
  }
  clientEvents.push({
    at: timeline.find((t) => t.label === 'turn1_utterance_sent')?.at,
    event: 'utterance_sent',
    turnId: turn1,
  })
  clientEvents.push({ at: timeline.find((t) => t.label === 'turn1_complete')?.at, event: 'turn_complete', turnId: turn1 })
  clientEvents.push({
    at: timeline.find((t) => t.label === 'turn2_utterance_sent')?.at,
    event: 'utterance_sent',
    turnId: turn2,
  })
  clientEvents.push({ at: timeline.find((t) => t.label === 'turn2_interrupt_sent')?.at, event: 'interrupt', turnId: turn2 })
  clientEvents.push({
    at: timeline.find((t) => t.label === 'turn2_interrupt_ack_or_cancel')?.at,
    event: 'turn_cancelled',
    turnId: turn2,
  })
  clientEvents.push({
    at: timeline.find((t) => t.label === 'turn3_utterance_sent')?.at,
    event: 'utterance_sent',
    turnId: turn3,
  })
  clientEvents.push({ at: timeline.find((t) => t.label === 'turn3_complete_recovery')?.at, event: 'turn_complete', turnId: turn3 })

  const report = buildLatencyEvidenceReport(clientEvents, {
    mode: ready.stubMode ? 'stub' : ready.offlineReal ? 'real' : 'real',
  })

  return {
    health: { stubMode: !!ready.stubMode },
    ready,
    agentText1: agentText1.text?.slice(0, 160),
    gotAudio,
    timeline,
    serverEventTypes: [...new Set(serverEvents.map((e) => e.type))],
    report,
    speechToAudioMs,
  }
}

checkEnvBlockers()
const health = await checkHealth()

let scenario = null
if (!blockers.some((b) => b.includes('health failed') || b.includes('SMOKE_AUTH'))) {
  try {
    scenario = await runWsScenario()
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    blockers.push(`WS scenario failed: ${detail}`)
    console.error(JSON.stringify({ step: 'scenario.failed', detail }))
  }
}

const outDir = path.join(root, 'docs', 'evidence', 'voice-agent')
mkdirSync(outDir, { recursive: true })
const outFile = path.join(
  outDir,
  `${new Date().toISOString().slice(0, 10)}-browser-live-real-evidence.json`,
)

const groqOk = !!scenario?.agentText1 && scenario?.serverEventTypes?.includes('turn.complete')
const interruptOk =
  (scenario?.report?.bargeInCount ?? 0) >= 1 &&
  (scenario?.report?.recoveryAfterInterruptRate ?? 0) >= 1
const turnCompletionOk =
  (scenario?.report?.turnCompletionRate ?? 0) >= 0.5 ||
  (scenario?.report?.sampleTurns ?? 0) >= 2
const output = {
  ok:
    blockers.filter((b) => !b.includes('TTS') && !b.includes('audio chunk')).length === 0 &&
    groqOk &&
    turnCompletionOk &&
    interruptOk,
  blockers,
  health,
  wsBase,
  scenario,
  generatedAt: new Date().toISOString(),
}

writeFileSync(outFile, JSON.stringify(output, null, 2))

console.log(
  JSON.stringify(
    {
      ok: output.ok,
      blockers,
      evidenceFile: outFile,
      mode: scenario?.report?.mode,
      speechToFirstAudioMs: {
        measured: scenario?.speechToAudioMs,
        p50: scenario?.report?.speechToFirstAudioMs?.p50,
        p95: scenario?.report?.speechToFirstAudioMs?.p95,
      },
      bargeInCount: scenario?.report?.bargeInCount ?? 0,
      turnCompletionRate: scenario?.report?.turnCompletionRate,
      recoveryAfterInterrupt: scenario?.report?.recoveryAfterInterruptRate,
      ttsMissingRate: scenario?.report?.ttsPartialOrMissingAudioRate,
      passes: scenario?.report?.passes,
    },
    null,
    2,
  ),
)

process.exit(output.ok ? 0 : 1)
