#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function parseJsonSafely(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const thresholdP95Ms = parsePositiveInt(
  process.env.MARKETING_RELEASE_EVIDENCE_LATENCY_GATE_MAX_P95_MS,
  600000
)
const warningOnly = process.env.MARKETING_RELEASE_EVIDENCE_LATENCY_GATE_WARNING_ONLY === '1'

const run = spawnSync(process.execPath, ['scripts/run-marketing-release-evidence-latency-rollup.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
})

const stdout = (run.stdout || '').trim()
const stderr = (run.stderr || '').trim()
const parsed = parseJsonSafely(stdout)
const p95Ms = Number(parsed?.p95Ms)
const hasP95 = Number.isFinite(p95Ms)
const thresholdBreached = hasP95 ? p95Ms > thresholdP95Ms : true
const overallOk = run.status === 0 && hasP95 && !thresholdBreached
const effectiveOk = warningOnly ? true : overallOk

const output = {
  check: 'marketing-release-evidence-latency-gate',
  warningOnly,
  thresholdP95Ms,
  p95Ms: hasP95 ? p95Ms : null,
  thresholdBreached,
  overallOk,
  effectiveOk,
  rollupCommandOk: run.status === 0,
  rollup: parsed ?? null,
}

console.log(JSON.stringify(output, null, 2))

if (!effectiveOk) {
  if (!hasP95) {
    console.error('\n# Latency gate failure')
    console.error('p95 latency value missing from rollup output.')
  } else if (thresholdBreached) {
    console.error('\n# Latency gate failure')
    console.error(`p95 ${p95Ms}ms exceeds threshold ${thresholdP95Ms}ms.`)
  }
  if (stderr) {
    console.error('\n# Rollup stderr')
    console.error(stderr)
  }
}

process.exit(effectiveOk ? 0 : 1)

