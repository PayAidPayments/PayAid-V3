#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function runNodeStep(label, scriptPath, env = process.env) {
  const startedAt = Date.now()
  const result = spawnSync(process.execPath, [scriptPath], {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  return {
    label,
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    command: [process.execPath, scriptPath].join(' '),
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  }
}

const sharedWarnEnv = {
  ...process.env,
  MARKETING_RELEASE_GATE_EVIDENCE_WARNING_ONLY: '1',
}

const steps = [
  runNodeStep(
    'marketing-warning-flag-resolver-test',
    'scripts/test-marketing-release-warning-flag-resolver.mjs'
  ),
  runNodeStep(
    'marketing-evidence-bundle-warn-smoke',
    'scripts/run-marketing-release-gate-evidence-bundle.mjs',
    sharedWarnEnv
  ),
]

const overallOk = steps.every((s) => s.ok)
const output = {
  check: 'marketing-release-evidence-helpers-suite',
  overallOk,
  steps: steps.map((s) => ({
    label: s.label,
    ok: s.ok,
    exitCode: s.exitCode,
    elapsedMs: s.elapsedMs,
  })),
}

console.log(JSON.stringify(output, null, 2))

if (!overallOk) {
  const failed = steps.find((s) => !s.ok)
  if (failed?.stdout) {
    console.error('\n# Failed step stdout')
    console.error(failed.stdout)
  }
  if (failed?.stderr) {
    console.error('\n# Failed step stderr')
    console.error(failed.stderr)
  }
}

process.exit(overallOk ? 0 : 1)

