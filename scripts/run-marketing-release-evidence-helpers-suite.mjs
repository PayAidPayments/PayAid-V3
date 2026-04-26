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

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

const sharedWarnEnv = {
  ...process.env,
  MARKETING_RELEASE_GATE_EVIDENCE_WARNING_ONLY: '1',
}

const smokeMaxMs = parsePositiveInt(process.env.MARKETING_RELEASE_EVIDENCE_HELPERS_SUITE_SMOKE_MAX_MS)

const steps = [
  runNodeStep(
    'marketing-policy-mirror-regression-test',
    'scripts/test-marketing-release-policy-mirror.mjs'
  ),
  runNodeStep(
    'marketing-policy-mirror-verifier-test',
    'scripts/verify-marketing-release-policy-mirror.mjs'
  ),
  runNodeStep(
    'marketing-warning-flag-resolver-test',
    'scripts/test-marketing-release-warning-flag-resolver.mjs'
  ),
  runNodeStep(
    'marketing-timeout-helpers-test',
    'scripts/test-marketing-release-timeout-helpers.mjs'
  ),
  runNodeStep(
    'marketing-evidence-bundle-warn-smoke',
    'scripts/run-marketing-release-gate-evidence-bundle.mjs',
    sharedWarnEnv
  ),
]

const smokeStep = steps.find((s) => s.label === 'marketing-evidence-bundle-warn-smoke')
const smokeWithinBudget = smokeMaxMs === null ? true : (smokeStep?.elapsedMs ?? Number.MAX_SAFE_INTEGER) <= smokeMaxMs
const smokeLatencyViolation = !smokeWithinBudget
const overallOk = steps.every((s) => s.ok) && smokeWithinBudget
const output = {
  check: 'marketing-release-evidence-helpers-suite',
  overallOk,
  smokeMaxMs,
  smokeWithinBudget,
  smokeLatencyViolation,
  steps: steps.map((s) => ({
    label: s.label,
    ok: s.ok,
    exitCode: s.exitCode,
    elapsedMs: s.elapsedMs,
  })),
}

console.log(JSON.stringify(output, null, 2))

if (!overallOk) {
  if (smokeLatencyViolation) {
    console.error('\n# Smoke latency budget violated')
    console.error(
      `marketing-evidence-bundle-warn-smoke took ${smokeStep?.elapsedMs ?? 'unknown'}ms (max ${smokeMaxMs}ms).`
    )
  } else {
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
}

process.exit(overallOk ? 0 : 1)

