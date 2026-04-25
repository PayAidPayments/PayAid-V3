#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isStrictFlagEnabled } from './strict-flag.mjs'

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

const strictMode = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_HEALTH_EVIDENCE_STRICT)
const runCleanup = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_HEALTH_EVIDENCE_RUN_CLEANUP)
const cleanupApply = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_APPLY)
const command = 'npm run check:leads-bulk-retention-scheduler-health'
const run = spawnSync(process.execPath, ['scripts/check-leads-bulk-retention-scheduler-health.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
})

const stdout = (run.stdout || '').trim()
const stderr = (run.stderr || '').trim()
const parsed = parseJsonSafely(stdout)
const now = new Date()
const stamp = isoForFile(now)
const outDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })

const jsonPath = join(outDir, `${stamp}-leads-bulk-retention-scheduler-health.json`)
const mdPath = join(outDir, `${stamp}-leads-bulk-retention-scheduler-health.md`)
const latestPath = join(outDir, 'latest-leads-bulk-retention-scheduler-health.md')

const evidence = {
  check: 'leads-bulk-retention-scheduler-health',
  capturedAt: now.toISOString(),
  command,
  strictMode,
  exitCode: run.status ?? 1,
  ok: Boolean(parsed?.ok),
  summary: parsed,
  stdout,
  stderr,
}

let cleanupResult = null
if (runCleanup) {
  const cleanupRun = spawnSync(process.execPath, ['scripts/cleanup-leads-bulk-retention-artifacts.mjs'], {
    env: {
      ...process.env,
      LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_APPLY: cleanupApply ? '1' : '0',
    },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  const cleanupStdout = (cleanupRun.stdout || '').trim()
  const cleanupStderr = (cleanupRun.stderr || '').trim()
  cleanupResult = {
    command: 'npm run cleanup:leads-bulk-retention-artifacts',
    apply: cleanupApply,
    exitCode: cleanupRun.status ?? 1,
    summary: parseJsonSafely(cleanupStdout),
    stdout: cleanupStdout,
    stderr: cleanupStderr,
  }
}

evidence.cleanup = cleanupResult

writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

const lines = [
  '# Leads Bulk Retention Scheduler Health Evidence',
  '',
  `- Captured at: ${evidence.capturedAt}`,
  `- Command: \`${command}\``,
  `- Strict mode: ${strictMode ? 'yes' : 'no'}`,
  `- Cleanup run: ${runCleanup ? 'yes' : 'no'}`,
  `- Cleanup apply: ${cleanupApply ? 'yes' : 'no'}`,
  `- Exit code: ${evidence.exitCode}`,
  `- Health OK: ${evidence.ok ? 'yes' : 'no'}`,
  '',
  '## Summary JSON',
  '',
  '```json',
  parsed
    ? JSON.stringify(parsed, null, 2)
    : JSON.stringify({ parseError: 'health output was not valid JSON', stdout }, null, 2),
  '```',
]

if (stderr) {
  lines.push('', '## stderr', '', '```text', stderr, '```')
}

if (cleanupResult) {
  lines.push(
    '',
    '## Cleanup',
    '',
    `- Command: \`${cleanupResult.command}\``,
    `- Apply mode: ${cleanupResult.apply ? 'yes' : 'no'}`,
    `- Exit code: ${cleanupResult.exitCode}`,
    '',
    '```json',
    cleanupResult.summary
      ? JSON.stringify(cleanupResult.summary, null, 2)
      : JSON.stringify({ parseError: 'cleanup output was not valid JSON', stdout: cleanupResult.stdout }, null, 2),
    '```',
  )
  if (cleanupResult.stderr) {
    lines.push('', '### Cleanup stderr', '', '```text', cleanupResult.stderr, '```')
  }
}

writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Leads Bulk Retention Scheduler Health',
  '',
  `- Last updated: ${evidence.capturedAt}`,
  `- Health OK: ${evidence.ok ? 'yes' : 'no'}`,
  `- Exit code: ${evidence.exitCode}`,
  '',
  '## Artifacts',
  '',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Quick Command',
  '',
  '- `npm run run:leads-bulk-retention-health-evidence`',
]
writeFileSync(latestPath, `${latestLines.join('\n')}\n`, 'utf8')

const handoff = spawnSync(process.execPath, ['scripts/generate-leads-bulk-retention-handoff-snippet.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
})
const handoffParsed = parseJsonSafely((handoff.stdout || '').trim())

console.log(
  JSON.stringify(
    {
      ok: evidence.ok,
      strictMode,
      runCleanup,
      cleanupApply,
      exitCode: evidence.exitCode,
      jsonPath,
      markdownPath: mdPath,
      latestPath,
      cleanup: cleanupResult
        ? {
            exitCode: cleanupResult.exitCode,
            apply: cleanupResult.apply,
          }
        : null,
      handoffSnippetPath:
        handoffParsed?.handoffSnippetPath || join(outDir, 'latest-leads-bulk-retention-handoff-snippet.md'),
      handoffGeneratorOk: handoff.status === 0,
    },
    null,
    2,
  ),
)

if (strictMode || (cleanupResult && cleanupResult.exitCode !== 0) || handoff.status !== 0) {
  if (cleanupResult && cleanupResult.exitCode !== 0) {
    process.exit(cleanupResult.exitCode)
  }
  if (handoff.status !== 0) {
    process.exit(handoff.status ?? 1)
  }
  process.exit(run.status ?? 1)
}
process.exit(0)
