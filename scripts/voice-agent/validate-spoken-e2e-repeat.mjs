#!/usr/bin/env node
/**
 * Prove spoken browser-live path 3× in a row:
 * agent.audio.chunk, barge-in, recording, transcript, CRM writeback artifacts.
 *
 * Prereqs:
 *   BROWSER_LIVE_TTS_PROVIDER=sarvam SARVAM_API_KEY=… GROQ_API_KEY=… DATABASE_URL=…
 *   BROWSER_LIVE_STUB=0 BROWSER_LIVE_PREFER_OFFLINE_REAL=0
 *   npm run dev:browser-live-ws
 *   npm run voice-agent:mint-validation-auth-token  → SMOKE_AUTH_TOKEN
 *
 * Server STT path (Sarvam Saaras via utterance.audio):
 *   SPOKEN_E2E_SERVER_STT=1 BROWSER_LIVE_STT_PROVIDER=sarvam npm run voice-agent:validate-spoken-e2e-repeat
 */
import WebSocket from 'ws'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const REPEATS = Number(process.env.SPOKEN_E2E_REPEATS || 3)
const wsBase = (process.env.NEXT_PUBLIC_VOICE_LIVE_WS_URL || 'ws://127.0.0.1:3002').replace(/\/$/, '')
const agentId = process.env.SMOKE_AGENT_ID || 'va_stage1_bolna_smoke'
const tenantId = process.env.SMOKE_TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const tokenArg =
  process.argv.find((a) => a.startsWith('--token='))?.split('=').slice(1).join('=') ||
  process.env.SMOKE_AUTH_TOKEN

const SESSION_READY_MS = Number(process.env.BROWSER_LIVE_SMOKE_SESSION_MS || 120_000)
const TURN_COMPLETE_MS = Number(process.env.BROWSER_LIVE_SMOKE_TURN_MS || 180_000)
const SESSION_END_MS = 60_000
const SERVER_STT = process.env.SPOKEN_E2E_SERVER_STT === '1'
const ttsAudioCache = new Map()

if (!tokenArg) {
  console.error(
    JSON.stringify({
      ok: false,
      error: 'JWT required — pass --token=… or set SMOKE_AUTH_TOKEN',
    }),
  )
  process.exit(1)
}

function findPastEvent(events, predicate) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (predicate(events[i])) return events[i]
  }
  return null
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
        reject(new Error(`${step}: ${fatal.message || 'sidecar error'} [saw: ${eventSummary()}]`))
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

async function probeTts() {
  const url = wsBase.replace(/^ws/, 'http') + '/health/tts'
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.ok) {
    throw new Error(`TTS health failed: ${body.lastError || res.status}`)
  }
  if (body.provider !== 'sarvam' && body.provider !== 'auto') {
    console.warn(JSON.stringify({ warn: 'TTS provider is not sarvam', provider: body.provider }))
  }
}

async function loadUtteranceAudio(text, language = 'en') {
  if (ttsAudioCache.has(text)) return ttsAudioCache.get(text)
  const { sarvamTts, isSarvamConfigured } = await import('../../lib/voice-agent/sarvam.ts')
  if (!isSarvamConfigured()) {
    throw new Error('SARVAM_API_KEY required for SPOKEN_E2E_SERVER_STT=1')
  }
  const buf = await sarvamTts(text, language, {
    outputCodec: 'mp3',
    signal: AbortSignal.timeout(45_000),
  })
  if (!buf?.length) throw new Error('Sarvam TTS returned empty audio for server STT probe')
  const payload = { mime: 'audio/mpeg', data: buf.toString('base64') }
  ttsAudioCache.set(text, payload)
  return payload
}

async function sendUserUtterance(ws, text, turnId) {
  if (SERVER_STT) {
    const audio = await loadUtteranceAudio(text)
    ws.send(
      JSON.stringify({
        type: 'utterance.audio',
        turnId,
        mime: audio.mime,
        data: audio.data,
        at: Date.now(),
      }),
    )
    return { mode: 'utterance.audio', audioBytes: audio.data.length }
  }
  ws.send(
    JSON.stringify({
      type: 'utterance.final',
      text,
      turnId,
      at: Date.now(),
    }),
  )
  return { mode: 'utterance.final' }
}

async function runOnce(runIndex) {
  const url = `${wsBase}/?token=${encodeURIComponent(tokenArg)}`
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
    const timer = setTimeout(() => reject(new Error('ws_open timeout')), 120_000)
    ws.once('open', () => {
      clearTimeout(timer)
      resolve()
    })
    ws.once('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })

  const callerPhone = `9${String(Date.now() + runIndex).slice(-9)}`
  ws.send(
    JSON.stringify({
      type: 'session.start',
      agentId,
      tenantId,
      callerPhone,
      crmWritebackEnabled: true,
      voiceBehavior: { tonePreset: 'calm_warm', pacePreset: 'normal' },
    }),
  )
  const ready = await waitFor(
    ws,
    events,
    (m) => m.type === 'session.ready',
    SESSION_READY_MS,
    `run${runIndex}:session.ready`,
  )

  if (ready.offlineReal) {
    throw new Error(
      `run${runIndex}: sidecar fell back to offline session (DATABASE_URL unreachable). CRM writeback requires DB.`,
    )
  }

  const turnId1 = `spoken-${runIndex}-1-${Date.now()}`
  const utterance1 = await sendUserUtterance(
    ws,
    'Hello, please greet me in one short sentence.',
    turnId1,
  )

  await waitFor(
    ws,
    events,
    (m) => m.type === 'agent.text' && m.turnId === turnId1,
    TURN_COMPLETE_MS,
    `run${runIndex}:agent.text`,
  )

  const audioChunk = await waitFor(
    ws,
    events,
    (m) =>
      m.type === 'agent.audio.chunk' &&
      m.turnId === turnId1 &&
      !m.final &&
      typeof m.data === 'string' &&
      m.data.length > 100,
    TURN_COMPLETE_MS,
    `run${runIndex}:agent.audio.chunk`,
  )

  ws.send(JSON.stringify({ type: 'interrupt', turnId: turnId1, at: Date.now() }))
  await waitFor(
    ws,
    events,
    (m) => m.type === 'interrupt.ack',
    30_000,
    `run${runIndex}:interrupt.ack`,
  )

  const turnId2 = `spoken-${runIndex}-2-${Date.now()}`
  const utterance2 = await sendUserUtterance(ws, 'Thanks, goodbye.', turnId2)
  await waitFor(
    ws,
    events,
    (m) => m.type === 'turn.complete' && m.turnId === turnId2,
    TURN_COMPLETE_MS,
    `run${runIndex}:turn.complete`,
  )

  const fakeRecording = Buffer.from(`demo-recording-run-${runIndex}`).toString('base64')
  ws.send(
    JSON.stringify({
      type: 'session.end',
      recordingMime: 'audio/webm',
      recordingData: fakeRecording,
    }),
  )

  const ended = await waitFor(
    ws,
    events,
    (m) => m.type === 'session.ended' && m.sessionId === ready.sessionId,
    SESSION_END_MS,
    `run${runIndex}:session.ended`,
  )

  ws.close()

  const artifacts = ended.artifacts
  if (!artifacts) throw new Error(`run${runIndex}: missing post-call artifacts`)
  if (!artifacts.summary) throw new Error(`run${runIndex}: missing summary`)
  if (!artifacts.disposition) throw new Error(`run${runIndex}: missing disposition`)
  if (!artifacts.entities || artifacts.entities.turnCount < 2) {
    throw new Error(`run${runIndex}: expected >=2 transcript turns`)
  }
  if (!artifacts.recording?.data) throw new Error(`run${runIndex}: missing recording artifact`)
  if (artifacts.routing !== 'unmatched_lead' && artifacts.routing !== 'matched_contact') {
    throw new Error(`run${runIndex}: expected CRM routing, got ${artifacts.routing}`)
  }
  if (artifacts.routing === 'unmatched_lead') {
    if (!artifacts.crm?.leadCreated) {
      throw new Error(`run${runIndex}: expected CRM lead creation`)
    }
    if (!artifacts.crm?.voiceLeadUnverified) {
      throw new Error(`run${runIndex}: expected Voice Lead (Unverified) CRM semantics`)
    }
  } else if (!artifacts.crm?.contactId || !artifacts.crm?.interactionId) {
    throw new Error(`run${runIndex}: expected matched contact CRM writeback`)
  }

  return {
    runIndex,
    sessionId: ready.sessionId,
    sttMode: SERVER_STT ? 'server_sarvam' : 'utterance_final',
    utteranceModes: [utterance1.mode, utterance2.mode],
    audioMime: audioChunk.mime,
    audioBytes: audioChunk.data.length,
    routing: artifacts.routing,
    disposition: artifacts.disposition,
    turnCount: artifacts.entities.turnCount,
    bargeIn: findPastEvent(events, (m) => m.type === 'interrupt.ack')?.bargeInCount ?? 0,
  }
}

await probeTts()
if (SERVER_STT) {
  console.log(
    JSON.stringify({
      info: 'server_stt_mode',
      provider: process.env.BROWSER_LIVE_STT_PROVIDER || 'auto',
      note: 'utterance.audio without clientTextHint — sidecar must Sarvam STT',
    }),
  )
}

const results = []
for (let i = 1; i <= REPEATS; i += 1) {
  try {
    results.push(await runOnce(i))
    console.log(JSON.stringify({ ok: true, pass: i, ...results[results.length - 1] }))
  } catch (e) {
    console.error(
      JSON.stringify({
        ok: false,
        pass: i,
        repeatsRequired: REPEATS,
        passesCompleted: i - 1,
        error: e instanceof Error ? e.message : String(e),
        results,
      }),
    )
    process.exit(1)
  }
}

console.log(
  JSON.stringify({
    ok: true,
    message: `Spoken E2E passed ${REPEATS} times in a row`,
    repeats: REPEATS,
    serverStt: SERVER_STT,
    results,
  }),
)
