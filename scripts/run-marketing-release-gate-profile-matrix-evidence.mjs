#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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

const run = spawnSync(process.execPath, ['scripts/run-marketing-release-gate-profile-matrix.mjs'], {
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

const jsonPath = join(outDir, `${stamp}-marketing-release-gate-profile-matrix.json`)
const mdPath = join(outDir, `${stamp}-marketing-release-gate-profile-matrix.md`)
const latestIndexPath = join(outDir, 'latest-marketing-release-gate-profile-matrix.md')

const evidence = {
  check: 'marketing-release-gate-profile-matrix',
  capturedAt: now.toISOString(),
  command: 'npm run run:marketing-release-gate:profile:matrix',
  exitCode: run.status ?? 1,
  ok: Boolean(parsed?.overallOk),
  summary: parsed ?? null,
  stdout,
  stderr,
}

writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

const mdLines = [
  '# Marketing Release Gate Profile Matrix Evidence',
  '',
  `- Captured at: ${evidence.capturedAt}`,
  `- Command: \`${evidence.command}\``,
  `- Exit code: ${evidence.exitCode}`,
  `- Overall OK: ${evidence.ok ? 'yes' : 'no'}`,
  '',
  '## Summary JSON',
  '',
  '```json',
  parsed
    ? JSON.stringify(parsed, null, 2)
    : JSON.stringify({ parseError: 'Matrix output was not valid JSON', stdout }, null, 2),
  '```',
]
if (stderr) mdLines.push('', '## stderr', '', '```text', stderr, '```')
writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Marketing Release Gate Profile Matrix',
  '',
  `- Last updated: ${evidence.capturedAt}`,
  `- Overall OK: ${evidence.ok ? 'yes' : 'no'}`,
  `- Exit code: ${evidence.exitCode}`,
  '',
  '## Artifacts',
  '',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Quick Command',
  '',
  '- `npm run run:marketing-release-gate:profile:matrix:evidence`',
]
writeFileSync(latestIndexPath, `${latestLines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: evidence.ok,
      exitCode: evidence.exitCode,
      jsonPath,
      markdownPath: mdPath,
      latestIndexPath,
    },
    null,
    2
  )
)

process.exit(run.status ?? 1)

