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

function runStep(label, scriptPath, env = process.env) {
  const run = spawnSync(process.execPath, [scriptPath], {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  const stdout = (run.stdout || '').trim()
  const stderr = (run.stderr || '').trim()
  return {
    label,
    scriptPath,
    ok: run.status === 0,
    exitCode: run.status ?? 1,
    parsed: parseJson(stdout),
    stdout,
    stderr,
  }
}

const steps = [
  runStep('marker-status', 'scripts/get-leads-bulk-retention-marker-mutation-status.mjs'),
  runStep('marker-verifier', 'scripts/verify-leads-bulk-retention-health-gate-marker.mjs'),
  runStep('next-actions', 'scripts/show-leads-bulk-retention-next-actions.mjs'),
]
const overallOk = steps.every((step) => step.ok)

const closureDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(closureDir, { recursive: true })
const stamp = isoForFile(new Date())
const jsonPath = join(closureDir, `${stamp}-leads-bulk-retention-safety-check.json`)
const mdPath = join(closureDir, `${stamp}-leads-bulk-retention-safety-check.md`)
const latestPath = join(closureDir, 'latest-leads-bulk-retention-safety-check.md')

const payload = {
  check: 'leads-bulk-retention-safety-check',
  generatedAt: new Date().toISOString(),
  overallOk,
  steps: steps.map((step) => ({
    label: step.label,
    ok: step.ok,
    exitCode: step.exitCode,
    scriptPath: step.scriptPath,
    parsed: step.parsed,
  })),
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = [
  '# Leads Bulk Retention Safety Check',
  '',
  `- Generated at: ${payload.generatedAt}`,
  `- Overall OK: ${payload.overallOk ? 'yes' : 'no'}`,
  `- JSON artifact: \`${jsonPath}\``,
  '',
  '## Steps',
  ...steps.map((step) => `- ${step.label}: ${step.ok ? 'pass' : 'fail'} (exit=${step.exitCode})`),
  '',
  '## Raw Results',
  '',
  '```json',
  JSON.stringify(payload, null, 2),
  '```',
]

writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')
writeFileSync(
  latestPath,
  [
    '# Latest Leads Bulk Retention Safety Check',
    '',
    `- Last updated: ${payload.generatedAt}`,
    `- Overall OK: ${payload.overallOk ? 'yes' : 'no'}`,
    '',
    '## Artifacts',
    '',
    `- JSON: \`${jsonPath}\``,
    `- Markdown: \`${mdPath}\``,
    '',
    '## Quick Command',
    '',
    '- `npm run run:leads-bulk-retention-safety-check`',
    '',
  ].join('\n'),
  'utf8',
)

console.log(
  JSON.stringify(
    {
      ok: payload.overallOk,
      check: payload.check,
      jsonPath,
      mdPath,
      latestPath,
    },
    null,
    2,
  ),
)

if (!payload.overallOk) {
  process.exit(1)
}
