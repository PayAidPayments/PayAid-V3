#!/usr/bin/env node
/**
 * End-to-end: ensure settings → deploy → wait READY → sync env → stage-1 smoke/latency.
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { readVercelCliToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

function run(label, args, extraEnv = {}) {
  console.log(`\n=== ${label} ===`)
  const r = spawnSync('node', args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: process.platform === 'win32',
  })
  return r.status === 0
}

const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_VOICE_PROJECT_ID || 'prj_vlDdR0KxmtdWXHGmjN1gI0EN952D'
const token = process.env.VERCEL_TOKEN || readVercelCliToken() || ''

if (!run('preflight-vercel-auth', ['scripts/voice-agent/preflight-vercel-auth.mjs'])) {
  process.exit(1)
}

if (!run('ensure-vercel-project', ['scripts/voice-agent/ensure-voice-vercel-project-settings.mjs'])) {
  process.exit(1)
}

const deployOk = run('deploy-voice', ['scripts/voice-agent/deploy-voice-vercel.mjs'], {
  VERCEL_TOKEN: token,
  VERCEL_ORG_ID: teamId,
  VERCEL_PROJECT_ID: projectId,
})
if (!deployOk) {
  console.error(JSON.stringify({ ok: false, step: 'deploy', error: 'deploy command failed' }, null, 2))
  process.exit(1)
}

if (!run('wait-ready', ['scripts/voice-agent/wait-voice-vercel-ready.mjs'], {
  VERCEL_TOKEN: token,
  VERCEL_ORG_ID: teamId,
  VERCEL_VOICE_PROJECT_ID: projectId,
  VERCEL_READY_TIMEOUT_MS: process.env.VERCEL_READY_TIMEOUT_MS || String(25 * 60 * 1000),
})) {
  process.exit(1)
}

if (!run('sync-env', ['scripts/voice-agent/sync-stage1-vercel-env.mjs'])) {
  process.exit(1)
}

const validateOk = run('stage1-live', ['scripts/voice-agent/run-stage1-live-validation.mjs'])
console.log(JSON.stringify({ ok: validateOk, pipeline: 'complete' }, null, 2))
process.exit(validateOk ? 0 : 1)
