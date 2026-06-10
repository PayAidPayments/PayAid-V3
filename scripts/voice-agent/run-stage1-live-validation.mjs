#!/usr/bin/env node
/**
 * Run Stage 1 live validation end-to-end (prep → smoke → latency evidence).
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  })
  return r.status === 0
}

const baseUrl =
  process.env.BASE_URL ||
  process.env.VOICE_APP_BASE_URL ||
  process.env.PAYAID_BRIDGE_BASE_URL ||
  'https://voice-emrn0qy95-payaid-projects-a67c6b27.vercel.app'

const env = {
  BASE_URL: baseUrl,
  PAYAID_BRIDGE_BASE_URL: baseUrl,
  TENANT_ID: process.env.TENANT_ID || 'cmjptk2mw0000aocw31u48n64',
  VOICE_AGENT_BOLNA_SMOKE_AGENT_ID:
    process.env.VOICE_AGENT_BOLNA_SMOKE_AGENT_ID || 'va_stage1_bolna_smoke',
  VOICE_AGENT_BOLNA_SMOKE_CALL_SID:
    process.env.VOICE_AGENT_BOLNA_SMOKE_CALL_SID || 'CA_STAGE1_SMOKE_LIVE',
  VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS: process.env.VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS || '90000',
}

console.log('Stage 1 live validation')
console.log('BASE_URL:', baseUrl)

if (!run('node', ['scripts/voice-agent/apply-voice-runtime-migration.mjs'], env)) {
  process.exit(1)
}

let authToken = process.env.AUTH_TOKEN || process.env.API_AUTH_TOKEN || ''
if (!authToken) {
  const mint = spawnSync('node', ['scripts/voice-agent/mint-stage1-validation-auth-token.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
  if (mint.status === 0 && mint.stdout?.trim()) {
    authToken = mint.stdout.trim()
    env.AUTH_TOKEN = authToken
    env.API_AUTH_TOKEN = authToken
  }
}

const smokeOk = run('node', ['scripts/voice-agent/bolna-bridge-stage1-smoke.mjs'], env)
const latencyOk = authToken
  ? run('node', ['scripts/voice-agent/capture-bolna-latency-evidence.mjs'], env)
  : (console.warn('Skipping latency — AUTH_TOKEN missing'), false)

console.log(
  JSON.stringify(
    {
      smokeOk,
      latencyOk,
      baseUrl,
      hasAuthToken: Boolean(authToken),
      hasBypass: Boolean(
        process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      ),
    },
    null,
    2,
  ),
)

process.exit(smokeOk && (latencyOk || !authToken) ? 0 : 1)
