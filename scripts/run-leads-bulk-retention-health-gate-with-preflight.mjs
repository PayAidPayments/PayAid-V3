#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function runNpmScript(scriptName, env = process.env) {
  const run = spawnSync('npm', ['run', scriptName], {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
  })
  const stdout = (run.stdout || '').trim()
  const stderr = (run.stderr || '').trim()
  return {
    ok: run.status === 0,
    exitCode: run.status ?? 1,
    parsed: parseJson(stdout) || parseJson(stderr),
    stdout,
    stderr,
  }
}

const preflight = runNpmScript('check:leads-bulk-retention-scheduler-health:fast:3000')
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

const gate = runNpmScript('run:leads-bulk-retention-health-gate-pipeline')
console.log(
  JSON.stringify(
    {
      ok: gate.ok,
      check: 'leads-bulk-retention-health-gate-with-preflight',
      blocked: false,
      preflight: {
        ok: preflight.ok,
        exitCode: preflight.exitCode,
      },
      gate: {
        ok: gate.ok,
        exitCode: gate.exitCode,
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
