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

const suiteEnv = {
  ...process.env,
  LEADS_BULK_RETENTION_HEALTH_TENANT_ID:
    process.env.LEADS_BULK_RETENTION_HEALTH_TENANT_ID || 'demo-business-pvt-ltd',
  LEADS_BULK_RETENTION_HEALTH_BASE_URL:
    process.env.LEADS_BULK_RETENTION_HEALTH_BASE_URL || 'http://127.0.0.1:3010',
  LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_QUICK_TRIAGE_EVIDENCE:
    process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_QUICK_TRIAGE_EVIDENCE || '180000',
  LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_NEXT_ACTIONS:
    process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_NEXT_ACTIONS || '180000',
}

const smokeMaxMs = parsePositiveInt(process.env.LEADS_BULK_RETENTION_HELPERS_SUITE_SMOKE_MAX_MS)

const steps = [
  runNodeStep(
    'leads-policy-mirror-regression-test',
    'scripts/test-leads-bulk-retention-policy-mirror.mjs',
    suiteEnv,
  ),
  runNodeStep(
    'leads-policy-mirror-verifier-test',
    'scripts/verify-leads-bulk-retention-policy-mirror.mjs',
    suiteEnv,
  ),
  runNodeStep(
    'leads-timeout-guardrails-regression-test',
    'scripts/test-leads-bulk-retention-timeout-guardrails.mjs',
    suiteEnv,
  ),
  runNodeStep(
    'leads-quick-triage-next-action-timeout-guard-smoke',
    'scripts/run-leads-bulk-retention-health-quick-triage-next-action.mjs',
    suiteEnv,
  ),
]

const smokeStep = steps.find((s) => s.label === 'leads-quick-triage-next-action-timeout-guard-smoke')
const smokeWithinBudget =
  smokeMaxMs === null ? true : (smokeStep?.elapsedMs ?? Number.MAX_SAFE_INTEGER) <= smokeMaxMs
const smokeLatencyViolation = !smokeWithinBudget
const overallOk = steps.every((s) => s.ok) && smokeWithinBudget

const output = {
  check: 'leads-bulk-retention-helpers-suite',
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
      `leads-quick-triage-next-action-timeout-guard-smoke took ${smokeStep?.elapsedMs ?? 'unknown'}ms (max ${smokeMaxMs}ms).`,
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
