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

function runEvidenceStep(label, scriptPath, commandLabel) {
  const startedAt = Date.now()
  const run = spawnSync(process.execPath, [scriptPath], {
    env: { ...process.env },
    encoding: 'utf8',
    stdio: 'pipe',
  })

  const stdout = (run.stdout || '').trim()
  const stderr = (run.stderr || '').trim()
  const parsed = parseJsonSafely(stdout)

  return {
    label,
    command: commandLabel,
    ok: run.status === 0,
    exitCode: run.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    parsed,
    stdout,
    stderr,
  }
}

const warningOnly = process.env.MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_WARNING_ONLY === '1'

const matrix = runEvidenceStep(
  'marketing-gate-profile-matrix-evidence',
  'scripts/run-marketing-release-gate-profile-matrix-evidence.mjs',
  'npm run run:marketing-release-gate:profile:matrix:evidence'
)
const verdict = runEvidenceStep(
  'marketing-gate-verdict-evidence',
  'scripts/run-marketing-release-gate-verdict-evidence.mjs',
  'npm run run:marketing-release-gate-verdict-evidence'
)

const now = new Date()
const stamp = isoForFile(now)
const outDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })

const jsonPath = join(outDir, `${stamp}-marketing-release-gate-evidence-bundle.json`)
const mdPath = join(outDir, `${stamp}-marketing-release-gate-evidence-bundle.md`)
const latestIndexPath = join(outDir, 'latest-marketing-release-gate-evidence-bundle.md')

const steps = [matrix, verdict]
const overallOk = steps.every((step) => step.ok)
const effectiveOk = warningOnly ? true : overallOk

const evidence = {
  check: 'marketing-release-gate-evidence-bundle',
  capturedAt: now.toISOString(),
  command: 'npm run run:marketing-release-gate-evidence-bundle',
  warningOnly,
  overallOk,
  effectiveOk,
  steps: steps.map((step) => ({
    label: step.label,
    command: step.command,
    ok: step.ok,
    exitCode: step.exitCode,
    elapsedMs: step.elapsedMs,
    summary: step.parsed ?? null,
  })),
}

writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

const mdLines = [
  '# Marketing Release Gate Evidence Bundle',
  '',
  `- Captured at: ${evidence.capturedAt}`,
  `- Command: \`${evidence.command}\``,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Effective OK: ${effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  '',
  '## Step Results',
  '',
  `- Matrix evidence: ${matrix.ok ? 'ok' : 'failed'} (exit ${matrix.exitCode})`,
  `- Verdict evidence: ${verdict.ok ? 'ok' : 'failed'} (exit ${verdict.exitCode})`,
  '',
  '## Summary JSON',
  '',
  '```json',
  JSON.stringify(evidence, null, 2),
  '```',
]

if (matrix.stderr) {
  mdLines.push('', '## Matrix stderr', '', '```text', matrix.stderr, '```')
}
if (verdict.stderr) {
  mdLines.push('', '## Verdict stderr', '', '```text', verdict.stderr, '```')
}

writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Marketing Release Gate Evidence Bundle',
  '',
  `- Last updated: ${evidence.capturedAt}`,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Effective OK: ${effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  '',
  '## Artifacts',
  '',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Quick Command',
  '',
  '- `npm run run:marketing-release-gate-evidence-bundle`',
]
writeFileSync(latestIndexPath, `${latestLines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: effectiveOk,
      overallOk,
      warningOnly,
      jsonPath,
      markdownPath: mdPath,
      latestIndexPath,
      steps: evidence.steps,
    },
    null,
    2
  )
)

process.exit(effectiveOk ? 0 : 1)

