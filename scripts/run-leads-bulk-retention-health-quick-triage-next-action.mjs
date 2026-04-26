#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function runNodeScript(scriptPath, env = process.env) {
  const run = spawnSync(process.execPath, [scriptPath], {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
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

const quickTriageEvidence = runNodeScript('scripts/run-leads-bulk-retention-health-quick-triage-evidence.mjs')
const nextActions = runNodeScript('scripts/show-leads-bulk-retention-next-actions.mjs')

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
      parsed: quickTriageEvidence.parsed,
    },
    nextActions: {
      ok: nextActions.ok,
      exitCode: nextActions.exitCode,
      parsed: nextActions.parsed,
    },
  },
  suggestedCommands,
}

console.log(JSON.stringify(summary, null, 2))
if (!summary.ok) {
  process.exit(1)
}
