#!/usr/bin/env node
/**
 * Poll local voice dev until bridge route responds, then run Stage 1 smoke + latency.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:3003').replace(/\/$/, '')
const maxWaitMs = Number(process.env.VOICE_DEV_WAIT_MS || '600000')
const intervalMs = 15000
const probePath = '/api/v1/voice-agents/runtime/bolna/kb/search'

async function bridgeReachable() {
  try {
    const res = await fetch(`${baseUrl}${probePath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(20000),
    })
    const text = await res.text()
    const html = text.includes('<!DOCTYPE html>') || text.includes('Authentication Required')
    const json401 = res.status === 401 && text.trim().startsWith('{')
    return {
      ok: json401 || (!html && res.status === 403),
      status: res.status,
      snippet: text.slice(0, 120),
    }
  } catch (error) {
    return { ok: false, status: null, snippet: error instanceof Error ? error.message : String(error) }
  }
}

const started = Date.now()
console.log(`Waiting for voice dev at ${baseUrl} (max ${maxWaitMs}ms)...`)
while (Date.now() - started < maxWaitMs) {
  const p = await bridgeReachable()
  console.log(JSON.stringify({ elapsedMs: Date.now() - started, ...p }))
  if (p.ok) break
  await new Promise((r) => setTimeout(r, intervalMs))
}

const final = await bridgeReachable()
if (!final.ok) {
  console.error('Voice dev not ready — start: npm run dev -w voice')
  process.exit(1)
}

function run(script, extraEnv = {}) {
  const r = spawnSync('node', [script], {
    cwd: root,
    env: { ...process.env, BASE_URL: baseUrl, PAYAID_BRIDGE_BASE_URL: baseUrl, ...extraEnv },
    stdio: 'inherit',
  })
  return r.status === 0
}

const smokeOk = run('scripts/voice-agent/bolna-bridge-stage1-smoke.mjs')
let authToken = process.env.AUTH_TOKEN || process.env.API_AUTH_TOKEN || ''
if (!authToken) {
  const mint = spawnSync('node', ['scripts/voice-agent/mint-stage1-validation-auth-token.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })
  if (mint.status === 0 && mint.stdout?.trim()) authToken = mint.stdout.trim()
}
const latencyOk = authToken
  ? run('scripts/voice-agent/capture-bolna-latency-evidence.mjs', {
      AUTH_TOKEN: authToken,
      API_AUTH_TOKEN: authToken,
    })
  : false

console.log(JSON.stringify({ smokeOk, latencyOk, baseUrl }, null, 2))
process.exit(smokeOk && latencyOk ? 0 : 1)
