#!/usr/bin/env node
/**
 * Investor demo readiness snapshot (operator laptop).
 * Usage: npm run voice-agent:status-browser-live-investor
 */
import dotenv from 'dotenv'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'
import jwt from 'jsonwebtoken'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const healthUrl =
  process.env.BROWSER_LIVE_HEALTH_URL ||
  `http://127.0.0.1:${process.env.VOICE_LIVE_WS_PORT || '3002'}/health`
const tunnelFile = path.join(root, '.tmp', 'browser-live-tunnel-url.txt')
const localWs = (process.env.NEXT_PUBLIC_VOICE_LIVE_WS_URL || 'ws://127.0.0.1:3002').replace(/\/$/, '')
const tunnelWs = existsSync(tunnelFile) ? readFileSync(tunnelFile, 'utf8').trim() : ''
const liveDemo =
  'https://voice-six-xi.vercel.app/voice-agents/cmjptk2mw0000aocw31u48n64/LiveDemo?agentId=va_stage1_bolna_smoke'

const out = { ok: true, checks: [], blockers: [], warnings: [] }

async function checkHealth() {
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) })
    const body = await res.json()
    out.checks.push({ name: 'sidecar_health', ok: !!body.ok, body })
    if (!body.ok) out.blockers.push('Sidecar health not ok')
    if (body.stubMode && !body.offlineReal) out.blockers.push('Sidecar in stub-only mode')
    return body
  } catch (e) {
    out.checks.push({ name: 'sidecar_health', ok: false, error: String(e) })
    out.blockers.push('Sidecar not reachable — run: npm run dev:browser-live-ws:offline')
    return null
  }
}

function mintToken() {
  const secret = (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '').trim()
  if (!secret) return null
  return jwt.sign(
    {
      sub: 'stage1_validation_user',
      tenant_id: 'cmjptk2mw0000aocw31u48n64',
      tenantId: 'cmjptk2mw0000aocw31u48n64',
      roles: ['owner'],
      permissions: [],
      modules: ['ai-studio'],
    },
    secret,
    { expiresIn: '1h' },
  )
}

async function checkWs(wsBase, label) {
  const token = mintToken()
  if (!token) {
    out.checks.push({ name: `wss_${label}`, ok: false, error: 'JWT_SECRET missing' })
    out.blockers.push('JWT_SECRET missing for WSS smoke')
    return
  }
  const url = `${wsBase}/?token=${encodeURIComponent(token)}`
  return new Promise((resolve) => {
    const events = []
    let settled = false
    const finish = (fn) => {
      if (settled) return
      settled = true
      fn()
      resolve()
    }
    const ws = new WebSocket(url)
    const timer = setTimeout(() => {
      ws.terminate()
      finish(() => {
        out.checks.push({ name: `wss_${label}`, ok: false, wsBase, eventTypes: events.map((e) => e.type) })
        out.blockers.push(
          `WSS ${label} timeout (no session.ready in ${Number(process.env.BROWSER_LIVE_INVESTOR_WSS_MS || 120_000) / 1000}s)`,
        )
        out.ok = false
      })
    }, Number(process.env.BROWSER_LIVE_INVESTOR_WSS_MS || 120_000))
    ws.on('message', (raw) => {
      try {
        events.push(JSON.parse(String(raw)))
      } catch {
        /* ignore */
      }
    })
    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          type: 'session.start',
          agentId: 'va_stage1_bolna_smoke',
          tenantId: 'cmjptk2mw0000aocw31u48n64',
        }),
      )
    })
    ws.on('close', (code, reason) => {
      if (events.find((e) => e.type === 'session.ready')) return
      clearTimeout(timer)
      clearInterval(poll)
      finish(() => {
        if (code === 1008) {
          out.checks.push({ name: `wss_${label}`, ok: false, code, reason: reason.toString() })
          out.blockers.push(`WSS ${label}: Invalid token (use mint-stage1-validation-auth-token)`)
        } else if (code !== 1000 && code !== 1001) {
          out.checks.push({
            name: `wss_${label}`,
            ok: false,
            code,
            reason: reason.toString(),
            eventTypes: events.map((e) => e.type),
          })
          out.blockers.push(`WSS ${label} closed (${code}) before session.ready`)
        }
        out.ok = false
      })
    })
    ws.on('error', (err) => {
      clearTimeout(timer)
      clearInterval(poll)
      finish(() => {
        out.checks.push({ name: `wss_${label}`, ok: false, wsBase, error: err instanceof Error ? err.message : String(err) })
        out.blockers.push(`WSS ${label} failed (${err instanceof Error ? err.message : String(err)})`)
        out.ok = false
      })
    })
    const poll = setInterval(() => {
      const ready = events.find((e) => e.type === 'session.ready')
      if (ready) {
        clearTimeout(timer)
        clearInterval(poll)
        ws.close()
        finish(() => {
          out.checks.push({
            name: `wss_${label}`,
            ok: true,
            wsBase,
            sessionId: ready.sessionId,
            offlineReal: !!ready.offlineReal,
          })
        })
      }
    }, 100)
  })
}

async function checkLiveDemo() {
  try {
    const res = await fetch(liveDemo, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
    const ok = res.status === 200 || res.status === 307 || res.status === 308
    out.checks.push({ name: 'live_demo_http', ok, status: res.status, url: liveDemo })
    if (!ok) out.blockers.push(`LiveDemo HTTP ${res.status}`)
  } catch (e) {
    out.checks.push({ name: 'live_demo_http', ok: false, error: String(e) })
    out.blockers.push('LiveDemo URL unreachable')
    out.ok = false
  }
}

async function checkTts() {
  try {
    const sidecarProbe = await fetch(
      process.env.BROWSER_LIVE_TTS_HEALTH_URL || 'http://127.0.0.1:3002/health/tts',
      { signal: AbortSignal.timeout(12000) },
    )
    const body = await sidecarProbe.json()
    out.checks.push({ name: 'tts', ok: !!body.ok, status: sidecarProbe.status, body })
    if (!body.ok) {
      out.warnings = [
        ...(out.warnings || []),
        `TTS unstable (${body.successCount}/${body.attempts}, provider=${body.provider || 'auto'}) — text-only fallback recommended`,
      ]
    }
  } catch {
    out.checks.push({ name: 'tts', ok: false, note: 'text-only demo still works' })
    out.warnings = [...(out.warnings || []), 'TTS probe unavailable — text-only fallback active']
  }
}

await checkHealth()
if (tunnelWs) await checkWs(tunnelWs, 'tunnel')
await checkWs(localWs, 'local')
await checkLiveDemo()
await checkTts()

out.tunnelWss = tunnelWs || null
out.localWs = localWs
out.liveDemo = liveDemo
out.groqConfigured = !!process.env.GROQ_API_KEY?.trim()
out.offlineRealEnv =
  process.env.BROWSER_LIVE_OFFLINE_REAL === '1' ||
  process.env.BROWSER_LIVE_PREFER_OFFLINE_REAL === '1'

if (out.blockers.length) out.ok = false

if (!out.warnings?.length) delete out.warnings

console.log(JSON.stringify(out, null, 2))
process.exit(out.ok ? 0 : 1)
