#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { enrichTimeoutResult, resolveTimeoutMs } from './lib/timeout-helpers.mjs'
import { resolveWarningOnlyFlag } from './lib/warning-only-flag.mjs'

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

const stepTimeoutMs = resolveTimeoutMs({
  globalKey: 'MARKETING_RELEASE_EVIDENCE_HELPERS_SUITE_STEP_TIMEOUT_MS',
})

const warningOnly = resolveWarningOnlyFlag({
  specificKey: 'MARKETING_RELEASE_EVIDENCE_HELPERS_SUITE_WARNING_ONLY',
})

const run = spawnSync(process.execPath, ['scripts/run-marketing-release-evidence-helpers-suite.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: stepTimeoutMs,
})

const stdout = (run.stdout || '').trim()
const timeoutMeta = enrichTimeoutResult({
  label: 'marketing-release-evidence-helpers-suite',
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

const jsonPath = join(outDir, `${stamp}-marketing-release-evidence-helpers-suite.json`)
const mdPath = join(outDir, `${stamp}-marketing-release-evidence-helpers-suite.md`)
const latestIndexPath = join(outDir, 'latest-marketing-release-evidence-helpers-suite.md')

const evidence = {
  check: 'marketing-release-evidence-helpers-suite',
  capturedAt: now.toISOString(),
  command: 'npm run run:marketing-release-evidence-helpers-suite:evidence',
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
  '# Marketing Release Evidence Helpers Suite',
  '',
  `- Captured at: ${evidence.capturedAt}`,
  `- Command: \`${evidence.command}\``,
  `- Exit code: ${evidence.exitCode}`,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Effective OK: ${effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  `- Step timeout (ms): ${stepTimeoutMs}`,
  `- Timed out: ${timedOut ? 'yes' : 'no'}`,
  '',
  '## Summary JSON',
  '',
  '```json',
  parsed
    ? JSON.stringify(parsed, null, 2)
    : JSON.stringify(
        { parseError: 'Helpers suite output was not valid JSON', stdout: stdout },
        null,
        2
      ),
  '```',
]

if (stderr) {
  mdLines.push('', '## stderr', '', '```text', stderr, '```')
}

writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Marketing Release Evidence Helpers Suite',
  '',
  `- Last updated: ${evidence.capturedAt}`,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Effective OK: ${effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  `- Step timeout (ms): ${stepTimeoutMs}`,
  `- Timed out: ${timedOut ? 'yes' : 'no'}`,
  `- Exit code: ${evidence.exitCode}`,
  '',
  '## Artifacts',
  '',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Quick Command',
  '',
  '- `npm run run:marketing-release-evidence-helpers-suite:evidence`',
]
writeFileSync(latestIndexPath, `${latestLines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: effectiveOk,
      overallOk,
      warningOnly,
      timedOut,
      stepTimeoutMs,
      exitCode: evidence.exitCode,
      jsonPath,
      markdownPath: mdPath,
      latestIndexPath,
    },
    null,
    2
  )
)

process.exit(effectiveOk ? 0 : run.status ?? 1)

