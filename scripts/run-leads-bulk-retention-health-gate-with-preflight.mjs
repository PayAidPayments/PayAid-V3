#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { enrichTimeoutResult, resolveTimeoutMs } from './lib/timeout-helpers.mjs'

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function runNpmScript(scriptName, env = process.env, timeoutMs = 300000) {
  const run = spawnSync('npm', ['run', scriptName], {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
    timeout: timeoutMs,
  })
  const stdout = (run.stdout || '').trim()
  const timeout = enrichTimeoutResult({
    label: scriptName,
    timeoutMs,
    status: run.status,
    error: run.error,
    stderr: run.stderr || '',
  })
  return {
    ok: run.status === 0,
    exitCode: timeout.exitCode,
    timedOut: timeout.timedOut,
    timeoutMs,
    parsed: parseJson(stdout) || parseJson(timeout.stderr),
    stdout,
    stderr: timeout.stderr,
  }
}

const preflightTimeoutMs = resolveTimeoutMs({
  globalKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS',
  specificKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_PREFLIGHT',
  fallbackMs: 180000,
})
const gateTimeoutMs = resolveTimeoutMs({
  globalKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS',
  specificKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_GATE_PIPELINE',
  fallbackMs: 300000,
})

const preflight = runNpmScript(
  'check:leads-bulk-retention-scheduler-health:fast:3000',
  process.env,
  preflightTimeoutMs,
)
if (!preflight.ok) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        check: 'leads-bulk-retention-health-gate-with-preflight',
        blocked: true,
        reason: 'scheduler_health_preflight_failed',
        preflight: {
          ok: preflight.ok,
          exitCode: preflight.exitCode,
          timedOut: preflight.timedOut,
          timeoutMs: preflight.timeoutMs,
          parsed: preflight.parsed,
        },
        suggestedCommands: [
          'npm run check:leads-bulk-retention-scheduler-health:quick-triage:next-action',
          'npm run run:leads-bulk-retention-health-gate-pipeline',
        ],
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const gate = runNpmScript('run:leads-bulk-retention-health-gate-pipeline', process.env, gateTimeoutMs)
console.log(
  JSON.stringify(
    {
      ok: gate.ok,
      check: 'leads-bulk-retention-health-gate-with-preflight',
      blocked: false,
      preflight: {
        ok: preflight.ok,
        exitCode: preflight.exitCode,
        timedOut: preflight.timedOut,
        timeoutMs: preflight.timeoutMs,
      },
      gate: {
        ok: gate.ok,
        exitCode: gate.exitCode,
        timedOut: gate.timedOut,
        timeoutMs: gate.timeoutMs,
        parsed: gate.parsed,
      },
    },
    null,
    2,
  ),
)

if (!gate.ok) {
  process.exit(1)
}
