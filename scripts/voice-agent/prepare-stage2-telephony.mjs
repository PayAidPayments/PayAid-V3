#!/usr/bin/env node
/**
 * Stage 2 telephony prep: env sync, credential gates, optional Docker bring-up.
 * Twilio must be set in .env.local or .env (never printed).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const outDir = path.join(root, 'docs', 'evidence', 'voice-agent')
const outputPath = path.join(outDir, `${stamp}-stage2-telephony-prep.md`)

function runNode(rel, extraEnv = {}) {
  const r = spawnSync('node', [rel], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return { ok: r.status === 0, stdout: r.stdout || '', stderr: r.stderr || '' }
}

function has(k) {
  return Boolean(String(process.env[k] || '').trim())
}

const twilioReady = has('TWILIO_ACCOUNT_SID') && has('TWILIO_AUTH_TOKEN') && has('TWILIO_PHONE_NUMBER')
const sarvamReady = has('SARVAM_API_KEY')

const steps = {
  syncSidecar: runNode('scripts/voice-agent/sync-bolna-sidecar-env-from-app.mjs'),
  pullBridge: runNode('scripts/voice-agent/pull-vercel-bridge-secret-to-local.mjs'),
  parity: runNode('scripts/voice-agent/check-bridge-secret-parity.mjs'),
  sarvamApi: sarvamReady ? runNode('scripts/voice-agent/smoke-sarvam-api-stage2.mjs') : { ok: false, skipped: true },
  sidecarCreds: twilioReady
    ? runNode('scripts/voice-agent/check-bolna-sidecar-credentials.mjs')
    : { ok: false, skipped: true },
  dockerHealth: runNode('scripts/voice-agent/check-docker-desktop-health.mjs'),
}

let composeUp = { ok: false, skipped: true }
if (twilioReady && steps.dockerHealth.ok) {
  const compose = spawnSync('docker', ['compose', 'up', '-d'], {
    cwd: path.join(root, 'deployment/bolna'),
    encoding: 'utf8',
    timeout: 300000,
  })
  composeUp = { ok: compose.status === 0, stderr: (compose.stderr || '').slice(0, 400) }
}

const blocking = []
if (!twilioReady) {
  blocking.push(
    'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to .env.local (then npm run voice-agent:sync-bolna-sidecar-env)',
  )
}
if (!sarvamReady) blocking.push('Add SARVAM_API_KEY to .env.local or .env')
if (!steps.dockerHealth.ok) blocking.push('Fix Docker Desktop (npm run voice-agent:check-docker-desktop-health)')

const ready = twilioReady && sarvamReady && steps.dockerHealth.ok && steps.sidecarCreds.ok && composeUp.ok

const lines = [
  '# Stage 2 telephony prep',
  '',
  `- Timestamp: ${iso}`,
  `- Twilio configured: ${twilioReady ? 'yes' : 'no'}`,
  `- Sarvam configured: ${sarvamReady ? 'yes' : 'no'}`,
  `- Docker healthy: ${steps.dockerHealth.ok ? 'yes' : 'no'}`,
  `- docker compose up: ${composeUp.skipped ? 'skipped' : composeUp.ok ? 'PASS' : 'FAIL'}`,
  `- Telephony ready: ${ready ? 'YES' : 'NO'}`,
  '',
  '## Steps',
  '',
]
for (const [k, v] of Object.entries(steps)) {
  lines.push(`- ${k}: ${v.skipped ? 'SKIP' : v.ok ? 'PASS' : 'FAIL'}`)
}
if (blocking.length) {
  lines.push('', '## Blocking', '')
  for (const b of blocking) lines.push(`- ${b}`)
}
lines.push('', '## Manual hi/ta/te call', '', 'After ready: place test calls via Twilio to agent with `voiceRuntime=bolna` and language hi/ta/te.', '')

writeFileSync(outputPath, `${lines.join('\n')}\n`)
console.log(JSON.stringify({ ok: ready, outputPath, twilioReady, sarvamReady, steps, composeUp: composeUp.ok }, null, 2))
process.exit(ready ? 0 : 1)
