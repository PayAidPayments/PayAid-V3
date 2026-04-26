#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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

const run = spawnSync(process.execPath, ['scripts/run-leads-bulk-retention-health-quick-triage.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
})

const stdout = (run.stdout || '').trim()
const stderr = (run.stderr || '').trim()
const parsed = parseJson(stdout) || parseJson(stderr)
const ok = run.status === 0 && Boolean(parsed?.ok)
const nowIso = new Date().toISOString()

const closureDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(closureDir, { recursive: true })

const stamp = isoForFile(new Date())
const jsonPath = join(closureDir, `${stamp}-leads-bulk-retention-health-quick-triage.json`)
const mdPath = join(closureDir, `${stamp}-leads-bulk-retention-health-quick-triage.md`)
const latestPath = join(closureDir, 'latest-leads-bulk-retention-health-quick-triage.md')

const payload = {
  check: 'leads-bulk-retention-health-quick-triage-evidence',
  capturedAt: nowIso,
  ok,
  quickTriageExitCode: run.status ?? 1,
  quickTriage: parsed,
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const probes = Array.isArray(parsed?.probes) ? parsed.probes : []
const lines = [
  '# Leads Bulk Retention Health Quick Triage',
  '',
  `- Captured at: ${nowIso}`,
  `- Overall OK: ${ok ? 'yes' : 'no'}`,
  `- Source command exit: ${run.status ?? 1}`,
  '',
  '## Probes',
  ...probes.map((probe) => `- ${probe.timeoutMs}ms: ${probe.ok ? 'pass' : 'fail'} (exit=${probe.exitCode})`),
  '',
  '## Artifacts',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
]

writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')
writeFileSync(
  latestPath,
  [
    '# Latest Leads Bulk Retention Health Quick Triage',
    '',
    `- Last updated: ${nowIso}`,
    `- Overall OK: ${ok ? 'yes' : 'no'}`,
    '',
    '## Artifacts',
    `- JSON: \`${jsonPath}\``,
    `- Markdown: \`${mdPath}\``,
    '',
    '## Quick Command',
    '- `npm run check:leads-bulk-retention-scheduler-health:quick-triage:evidence`',
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
