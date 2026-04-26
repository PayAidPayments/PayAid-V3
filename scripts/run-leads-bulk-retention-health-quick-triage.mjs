#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function runTimeoutProbe(timeoutMs) {
  const run = spawnSync(process.execPath, ['scripts/check-leads-bulk-retention-scheduler-health.mjs'], {
    env: {
      ...process.env,
      LEADS_BULK_RETENTION_HEALTH_FETCH_TIMEOUT_MS: String(timeoutMs),
    },
    encoding: 'utf8',
    stdio: 'pipe',
  })

  const stdout = (run.stdout || '').trim()
  const stderr = (run.stderr || '').trim()
  const parsed = parseJson(stdout) || parseJson(stderr)

  return {
    timeoutMs,
    ok: run.status === 0,
    exitCode: run.status ?? 1,
    parsed,
  }
}

const probes = [runTimeoutProbe(3000), runTimeoutProbe(5000)]
const overallOk = probes.every((probe) => probe.ok)
const summary = {
  ok: overallOk,
  check: 'leads-bulk-retention-health-quick-triage',
  evaluatedAt: new Date().toISOString(),
  probes,
}

console.log(JSON.stringify(summary, null, 2))
if (!overallOk) {
  process.exit(1)
}
