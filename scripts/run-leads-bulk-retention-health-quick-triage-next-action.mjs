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

function runNodeScript(scriptPath, env = process.env, timeoutMs = 300000) {
  const run = spawnSync(process.execPath, [scriptPath], {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: timeoutMs,
  })

  const stdout = (run.stdout || '').trim()
  const timeout = enrichTimeoutResult({
    label: scriptPath,
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

const quickTriageTimeoutMs = resolveTimeoutMs({
  globalKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS',
  specificKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_QUICK_TRIAGE_EVIDENCE',
  fallbackMs: 300000,
})
const nextActionsTimeoutMs = resolveTimeoutMs({
  globalKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS',
  specificKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_NEXT_ACTIONS',
  fallbackMs: 300000,
})

const quickTriageEvidence = runNodeScript(
  'scripts/run-leads-bulk-retention-health-quick-triage-evidence.mjs',
  process.env,
  quickTriageTimeoutMs,
)
const nextActions = runNodeScript(
  'scripts/show-leads-bulk-retention-next-actions.mjs',
  process.env,
  nextActionsTimeoutMs,
)

const suggestedCommands = []
if (quickTriageEvidence.ok && nextActions.ok) {
  suggestedCommands.push('npm run run:leads-bulk-retention-health-gate-pipeline')
  suggestedCommands.push('npm run run:leads-bulk-retention-safety-check')
} else if (!nextActions.ok) {
  suggestedCommands.push('npm run show:leads-bulk-retention-next-actions')
} else {
  const recommended = nextActions.parsed?.nextAction?.commands
  if (Array.isArray(recommended) && recommended.length > 0) {
    suggestedCommands.push(...recommended)
  } else {
    suggestedCommands.push('npm run check:leads-bulk-retention-scheduler-health:quick-triage:evidence')
  }
}

const summary = {
  ok: quickTriageEvidence.ok && nextActions.ok,
  check: 'leads-bulk-retention-health-quick-triage-next-action',
  evaluatedAt: new Date().toISOString(),
  steps: {
    quickTriageEvidence: {
      ok: quickTriageEvidence.ok,
      exitCode: quickTriageEvidence.exitCode,
      timedOut: quickTriageEvidence.timedOut,
      timeoutMs: quickTriageEvidence.timeoutMs,
      parsed: quickTriageEvidence.parsed,
    },
    nextActions: {
      ok: nextActions.ok,
      exitCode: nextActions.exitCode,
      timedOut: nextActions.timedOut,
      timeoutMs: nextActions.timeoutMs,
      parsed: nextActions.parsed,
    },
  },
  suggestedCommands,
}

console.log(JSON.stringify(summary, null, 2))
if (!summary.ok) {
  process.exit(1)
}
