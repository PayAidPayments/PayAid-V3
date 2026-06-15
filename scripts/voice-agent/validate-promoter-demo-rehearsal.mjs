#!/usr/bin/env node
/**
 * Full promoter-demo rehearsal (Phase 2 exit):
 * spoken call + barge-in + recording + CRM + trigger + escalation + dialer tick.
 */
import { spawnSync } from 'node:child_process'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })
if (!process.env.VOICE_SUPERVISOR_PHONE?.trim()) {
  process.env.VOICE_SUPERVISOR_PHONE = '+919876543210'
}

const useDirect = process.env.VOICE_REHEARSAL_DIRECT !== '0'
const skipSpoken = process.env.VOICE_REHEARSAL_SKIP_SPOKEN === '1'

const allSteps = [
  {
    name: 'spoken-e2e-once',
    cmd: 'node',
    args: ['scripts/voice-agent/validate-spoken-e2e-repeat.mjs'],
    env: { SPOKEN_E2E_REPEATS: '1' },
  },
  {
    name: 'escalation-spoken-once',
    cmd: 'node',
    args: ['scripts/voice-agent/validate-escalation-spoken-once.mjs'],
  },
  {
    name: 'trigger-queue',
    cmd: 'node',
    args: [
      useDirect
        ? 'scripts/voice-agent/smoke-trigger-queue-direct.ts'
        : 'scripts/voice-agent/smoke-trigger-webhooks.mjs',
    ],
  },
  {
    name: 'campaign-dialer-tick',
    cmd: 'node',
    args: [
      useDirect
        ? 'scripts/voice-agent/smoke-campaign-dialer-direct.ts'
        : 'scripts/voice-agent/smoke-campaign-dialer-tick.mjs',
    ],
  },
]

const steps = skipSpoken
  ? allSteps.filter((s) => s.name === 'trigger-queue' || s.name === 'campaign-dialer-tick')
  : allSteps

if (!useDirect) {
  steps.push({
    name: 'supervisor-monitor-no404',
    cmd: 'node',
    args: ['scripts/voice-agent/smoke-supervisor-monitor-no-404.mjs'],
  })
}

const tsxCli = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs')

function resolveStep(step) {
  if (useDirect && (step.name === 'trigger-queue' || step.name === 'campaign-dialer-tick')) {
    return { cmd: process.execPath, args: [tsxCli, ...step.args] }
  }
  return { cmd: step.cmd, args: step.args }
}

const results = []
for (const step of steps) {
  const run = resolveStep(step)
  const res = spawnSync(run.cmd, run.args, {
    cwd: root,
    env: { ...process.env, ...step.env },
    encoding: 'utf8',
    timeout: Number(process.env.VOICE_REHEARSAL_STEP_TIMEOUT_MS || 900_000),
  })
  const ok = res.status === 0
  results.push({
    step: step.name,
    ok,
    status: res.status,
    stderr: (res.stderr || '').slice(-500),
    stdout: (res.stdout || '').slice(-500),
  })
  console.log(JSON.stringify({ step: step.name, ok, status: res.status }))
  if (!ok) {
    console.error(JSON.stringify({ ok: false, failedStep: step.name, results }))
    process.exit(1)
  }
}

console.log(JSON.stringify({ ok: true, message: 'Promoter demo rehearsal passed', results }))
process.exit(0)
