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

const run = spawnSync(process.execPath, ['scripts/run-social-oauth-smoke-pipeline.mjs'], {
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

const jsonPath = join(outDir, `${stamp}-social-oauth-smoke.json`)
const mdPath = join(outDir, `${stamp}-social-oauth-smoke.md`)
const latestIndexPath = join(outDir, 'latest-social-oauth-smoke.md')

const evidence = {
  check: 'social-oauth-connectors-smoke',
  capturedAt: now.toISOString(),
  command: 'npm run run:social-oauth-smoke-pipeline',
  exitCode: run.status ?? 1,
  ok: Boolean(parsed?.overallOk),
  summary: parsed ?? null,
  stdout,
  stderr,
}

writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

const lines = [
  '# Social OAuth Smoke Evidence',
  '',
  `- Captured at: ${evidence.capturedAt}`,
  `- Command: \`${evidence.command}\``,
  `- Exit code: ${evidence.exitCode}`,
  `- Overall OK: ${evidence.ok ? 'yes' : 'no'}`,
  '',
  '## Summary JSON',
  '',
  '```json',
  parsed ? JSON.stringify(parsed, null, 2) : JSON.stringify({ parseError: 'Pipeline output was not valid JSON', stdout }, null, 2),
  '```',
]

if (stderr) {
  lines.push('', '## stderr', '', '```text', stderr, '```')
}

writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Social OAuth Smoke Evidence',
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
  '- `npm run run:social-oauth-smoke-evidence`',
]
writeFileSync(latestIndexPath, `${latestLines.join('\n')}\n`, 'utf8')

const handoff = spawnSync(process.execPath, ['scripts/generate-social-oauth-smoke-handoff-snippet.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
})
const handoffParsed = parseJsonSafely((handoff.stdout || '').trim())

console.log(
  JSON.stringify(
    {
      ok: evidence.ok,
      exitCode: evidence.exitCode,
      jsonPath,
      markdownPath: mdPath,
      latestIndexPath,
      handoffSnippetPath:
        handoffParsed?.handoffSnippetPath ||
        join(outDir, 'latest-social-oauth-smoke-handoff-snippet.md'),
      handoffGeneratorOk: handoff.status === 0,
    },
    null,
    2
  )
)

process.exit(run.status ?? 1)

