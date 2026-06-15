#!/usr/bin/env node
/**
 * Stage 2 Sarvam validation orchestrator (no Vercel redeploy).
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const { BOLNA_BRIDGE_SECRET: _shellBridge, ...envWithoutShellBridge } = process.env
const bridgeResolve = spawnSync('node', ['scripts/voice-agent/resolve-bridge-secret-for-smoke.mjs'], {
  cwd: root,
  encoding: 'utf8',
  env: envWithoutShellBridge,
})
const bridgeEnv =
  bridgeResolve.status === 0 && bridgeResolve.stdout?.trim()
    ? { BOLNA_BRIDGE_SECRET: bridgeResolve.stdout.trim() }
    : {}

function run(label, args, opts = {}) {
  console.log(`\n=== ${label} ===`)
  const r = spawnSync('node', args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...bridgeEnv, ...opts.env },
    shell: process.platform === 'win32',
  })
  return r.status === 0
}

const steps = {
  matrix: run('stage2-matrix', ['scripts/voice-agent/check-bolna-stage2-sarvam-matrix.mjs']),
  sidecarEnv: run('sync-sidecar-env', ['scripts/voice-agent/sync-bolna-sidecar-env-from-app.mjs']),
  sarvamApi: run('sarvam-api-smoke', ['scripts/voice-agent/smoke-sarvam-api-stage2.mjs']),
  verifyEnv: run('verify-stage1-vercel-env', ['scripts/voice-agent/verify-stage1-vercel-env.mjs']),
  preflight: run('stage1-preflight', ['scripts/voice-agent/check-bolna-stage1-preflight.mjs'], {
    env: { BOLNA_PREFLIGHT_SKIP_TWILIO: '1' },
  }),
  bridgeSmoke: run('stage2-bridge-events', ['scripts/voice-agent/smoke-stage2-sarvam-bridge-events.mjs']),
  seedPilot: run('seed-stage2-latency', ['scripts/voice-agent/seed-stage2-sarvam-latency-pilot.mjs']),
}

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
  ? run('latency-evidence', ['scripts/voice-agent/capture-bolna-latency-evidence.mjs'], {
      env: {
        AUTH_TOKEN: authToken,
        API_AUTH_TOKEN: authToken,
        VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS: process.env.VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS || '90000',
      },
    })
  : (console.warn('Skipping latency — AUTH_TOKEN missing'), false)

const stage1SmokeOk = run('stage1-bridge-regression', ['scripts/voice-agent/bolna-bridge-stage1-smoke.mjs'])

console.log(
  JSON.stringify(
    {
      ok: Object.values({ ...steps, latencyOk, stage1SmokeOk }).every(Boolean),
      steps: { ...steps, latencyOk, stage1SmokeOk },
      note: 'Voice Vercel deploy unchanged; full hi/ta/te telephony still manual via sidecar + Twilio.',
    },
    null,
    2,
  ),
)

process.exit(
  Object.values({ ...steps, latencyOk, stage1SmokeOk }).every(Boolean) ? 0 : 1,
)
