#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { enrichTimeoutResult, resolveTimeoutMs } from './lib/timeout-helpers.mjs'

function isoForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const preflightTimeoutMs = resolveTimeoutMs({
  globalKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS',
  specificKey: 'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_PREFLIGHT_EVIDENCE',
  fallbackMs: 300000,
})

const run = spawnSync(process.execPath, ['scripts/run-leads-bulk-retention-health-gate-with-preflight.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: preflightTimeoutMs,
})

const stdout = (run.stdout || '').trim()
const timeout = enrichTimeoutResult({
  label: 'run-leads-bulk-retention-health-gate-with-preflight.mjs',
  timeoutMs: preflightTimeoutMs,
  status: run.status,
  error: run.error,
  stderr: run.stderr || '',
})
const parsed = parseJson(stdout) || parseJson(timeout.stderr)
const ok = run.status === 0 && Boolean(parsed?.ok)
const capturedAt = new Date().toISOString()

const closureDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(closureDir, { recursive: true })
const stamp = isoForFile(new Date())

const jsonPath = join(closureDir, `${stamp}-leads-bulk-retention-health-gate-preflight.json`)
const mdPath = join(closureDir, `${stamp}-leads-bulk-retention-health-gate-preflight.md`)
const latestPath = join(closureDir, 'latest-leads-bulk-retention-health-gate-preflight.md')

const payload = {
  check: 'leads-bulk-retention-health-gate-preflight-evidence',
  capturedAt,
  ok,
  exitCode: timeout.exitCode,
  timedOut: timeout.timedOut,
  timeoutMs: preflightTimeoutMs,
  result: parsed,
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = [
  '# Leads Bulk Retention Health Gate Preflight',
  '',
  `- Captured at: ${capturedAt}`,
  `- Overall OK: ${ok ? 'yes' : 'no'}`,
  `- Exit code: ${timeout.exitCode}`,
  `- Timed out: ${timeout.timedOut ? 'yes' : 'no'}`,
  `- Timeout budget: ${preflightTimeoutMs}ms`,
  '',
  '## Artifacts',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Suggested Commands',
]

const suggested = Array.isArray(parsed?.suggestedCommands) ? parsed.suggestedCommands : []
if (suggested.length === 0) {
  lines.push('- `npm run run:leads-bulk-retention-health-gate:preflight`')
} else {
  for (const command of suggested) {
    lines.push(`- \`${command}\``)
  }
}

writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')
writeFileSync(
  latestPath,
  [
    '# Latest Leads Bulk Retention Health Gate Preflight',
    '',
    `- Last updated: ${capturedAt}`,
    `- Overall OK: ${ok ? 'yes' : 'no'}`,
    '',
    '## Artifacts',
    `- JSON: \`${jsonPath}\``,
    `- Markdown: \`${mdPath}\``,
    '',
    '## Quick Command',
    '- `npm run run:leads-bulk-retention-health-gate:preflight:evidence`',
    '',
  ].join('\n'),
  'utf8',
)

console.log(
  JSON.stringify(
    {
      ok,
      check: payload.check,
      jsonPath,
      markdownPath: mdPath,
      latestPath,
    },
    null,
    2,
  ),
)

if (!ok) {
  process.exit(1)
}
