#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { enrichTimeoutResult, resolveTimeoutMs } from './lib/timeout-helpers.mjs'

function isoForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function parseBooleanFlag(value) {
  if (value === undefined || value === null || String(value).trim() === '') return false
  const normalized = String(value).trim().toLowerCase()
  return ['1', 'true', 'yes', 'y', 'on'].includes(normalized)
}

const stepTimeoutMs = resolveTimeoutMs({
  globalKey: 'LEADS_BULK_RETENTION_HELPERS_SUITE_STEP_TIMEOUT_MS',
})
const warningOnly = parseBooleanFlag(process.env.LEADS_BULK_RETENTION_HELPERS_SUITE_WARNING_ONLY)

const run = spawnSync(process.execPath, ['scripts/run-leads-bulk-retention-helpers-suite.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: stepTimeoutMs,
})

const stdout = (run.stdout || '').trim()
const timeoutMeta = enrichTimeoutResult({
  label: 'leads-bulk-retention-helpers-suite',
  timeoutMs: stepTimeoutMs,
  status: run.status,
  error: run.error,
  stderr: run.stderr || '',
})

const parsed = parseJsonSafely(stdout)
const overallOk = Boolean(parsed?.overallOk)
const effectiveOk = warningOnly ? true : overallOk

const now = new Date()
const stamp = isoForFile(now)
const outDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })

const jsonPath = join(outDir, `${stamp}-leads-bulk-retention-helpers-suite.json`)
const mdPath = join(outDir, `${stamp}-leads-bulk-retention-helpers-suite.md`)
const latestIndexPath = join(outDir, 'latest-leads-bulk-retention-helpers-suite.md')

const evidence = {
  check: 'leads-bulk-retention-helpers-suite',
  capturedAt: now.toISOString(),
  command: 'npm run run:leads-bulk-retention-helpers-suite:evidence',
  warningOnly,
  overallOk,
  effectiveOk,
  stepTimeoutMs: timeoutMeta.timeoutMs,
  timedOut: timeoutMeta.timedOut,
  exitCode: timeoutMeta.exitCode,
  summary: parsed ?? null,
  stdout,
  stderr: timeoutMeta.stderr,
}

writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

const mdLines = [
  '# Leads Bulk Retention Helpers Suite',
  '',
  `- Captured at: ${evidence.capturedAt}`,
  `- Command: \`${evidence.command}\``,
  `- Exit code: ${evidence.exitCode}`,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Effective OK: ${effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  `- Step timeout (ms): ${stepTimeoutMs}`,
  `- Timed out: ${timeoutMeta.timedOut ? 'yes' : 'no'}`,
  '',
  '## Summary JSON',
  '',
  '```json',
  parsed
    ? JSON.stringify(parsed, null, 2)
    : JSON.stringify(
        { parseError: 'Helpers suite output was not valid JSON', stdout: stdout },
        null,
        2,
      ),
  '```',
]

if (timeoutMeta.stderr) {
  mdLines.push('', '## stderr', '', '```text', timeoutMeta.stderr, '```')
}

writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Leads Bulk Retention Helpers Suite',
  '',
  `- Last updated: ${evidence.capturedAt}`,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Effective OK: ${effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  `- Step timeout (ms): ${stepTimeoutMs}`,
  `- Timed out: ${timeoutMeta.timedOut ? 'yes' : 'no'}`,
  `- Exit code: ${evidence.exitCode}`,
  '',
  '## Artifacts',
  '',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Quick Command',
  '',
  '- `npm run run:leads-bulk-retention-helpers-suite:evidence`',
]
writeFileSync(latestIndexPath, `${latestLines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: effectiveOk,
      overallOk,
      warningOnly,
      timedOut: timeoutMeta.timedOut,
      stepTimeoutMs,
      exitCode: evidence.exitCode,
      jsonPath,
      markdownPath: mdPath,
      latestIndexPath,
    },
    null,
    2,
  ),
)

process.exit(effectiveOk ? 0 : run.status ?? 1)
