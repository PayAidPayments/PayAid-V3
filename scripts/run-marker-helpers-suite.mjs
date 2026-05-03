#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function runStep(label, commandArgs) {
  const startedAt = Date.now()
  const result = spawnSync(process.execPath, commandArgs, {
    env: { ...process.env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  return {
    label,
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    command: [process.execPath, ...commandArgs].join(' '),
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  }
}

const steps = [
  runStep('marker-policy', ['scripts/get-marker-mutation-policy.mjs']),
  runStep('marker-status', ['scripts/get-marker-mutation-status.mjs']),
  runStep('marker-doctor', ['scripts/run-marker-mutation-doctor.mjs']),
  runStep('marker-mode-guard-test', ['scripts/test-marker-mutation-approval-mode-guard.mjs']),
]

const overallOk = steps.every((s) => s.ok)
const summary = {
  check: 'marker-helpers-suite',
  overallOk,
  steps: steps.map((s) => ({
    label: s.label,
    ok: s.ok,
    exitCode: s.exitCode,
    elapsedMs: s.elapsedMs,
  })),
}

console.log(JSON.stringify(summary, null, 2))

if (!overallOk) {
  const failed = steps.find((s) => !s.ok)
  if (failed) {
    if (failed.stdout) {
      console.error('\n# Failed step stdout')
      console.error(failed.stdout)
    }
    if (failed.stderr) {
      console.error('\n# Failed step stderr')
      console.error(failed.stderr)
    }
  }
}

process.exit(overallOk ? 0 : 1)

