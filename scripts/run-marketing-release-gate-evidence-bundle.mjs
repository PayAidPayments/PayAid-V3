#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
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
  const overallOkFromSummary =
    parsed && typeof parsed.overallOk === 'boolean'
      ? parsed.overallOk
      : parsed && typeof parsed.ok === 'boolean'
        ? parsed.ok
        : run.status === 0

  return {
    label,
    command: commandLabel,
    ok: run.status === 0,
    overallOk: overallOkFromSummary,
    exitCode: run.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    parsed,
    stdout,
    stderr,
  }
}

const warningOnly = resolveWarningOnlyFlag({
  specificKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_WARNING_ONLY',
})
const includeEvidenceHelpers =
  process.env.MARKETING_RELEASE_INCLUDE_EVIDENCE_HELPERS === '1'
const evidenceHelpersWarningOnly =
  process.env.MARKETING_RELEASE_EVIDENCE_HELPERS_WARNING_ONLY === '1'

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
const evidenceHelpers = includeEvidenceHelpers
  ? runEvidenceStep(
      'marketing-evidence-helpers-suite-evidence',
      'scripts/run-marketing-release-evidence-helpers-suite-evidence.mjs',
      'npm run run:marketing-release-evidence-helpers-suite:evidence'
    )
  : null

const now = new Date()
const stamp = isoForFile(now)
const outDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })

const jsonPath = join(outDir, `${stamp}-marketing-release-gate-evidence-bundle.json`)
const mdPath = join(outDir, `${stamp}-marketing-release-gate-evidence-bundle.md`)
const latestIndexPath = join(outDir, 'latest-marketing-release-gate-evidence-bundle.md')

const steps = [matrix, verdict, evidenceHelpers].filter(Boolean)
const normalizedSteps = steps.map((step) => {
  const stepWarningOnly =
    step.label === 'marketing-evidence-helpers-suite-evidence' &&
    evidenceHelpersWarningOnly
  return {
    ...step,
    warningOnly: stepWarningOnly,
    effectiveOk: stepWarningOnly ? true : step.overallOk,
  }
})
const overallOk = normalizedSteps.every((step) => step.overallOk)
const effectiveOverallOk = normalizedSteps.every((step) => step.effectiveOk)

const evidence = {
  check: 'marketing-release-gate-evidence-bundle',
  capturedAt: now.toISOString(),
  command: 'npm run run:marketing-release-gate-evidence-bundle',
  warningOnly,
  includeEvidenceHelpers,
  evidenceHelpersWarningOnly,
  overallOk,
  effectiveOk: warningOnly ? true : effectiveOverallOk,
  steps: normalizedSteps.map((step) => ({
    label: step.label,
    command: step.command,
    ok: step.ok,
    overallOk: step.overallOk,
    warningOnly: step.warningOnly,
    effectiveOk: step.effectiveOk,
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
  `- Effective OK: ${evidence.effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  `- Include helpers evidence: ${includeEvidenceHelpers ? 'yes' : 'no'}`,
  `- Helpers warning only: ${evidenceHelpersWarningOnly ? 'yes' : 'no'}`,
  '',
  '## Step Results',
  '',
  `- Matrix evidence: ${matrix.overallOk ? 'ok' : 'failed'} (exit ${matrix.exitCode})`,
  `- Verdict evidence: ${verdict.overallOk ? 'ok' : 'failed'} (exit ${verdict.exitCode})`,
  includeEvidenceHelpers && evidenceHelpers
    ? `- Helpers-suite evidence: ${evidenceHelpers.overallOk ? 'ok' : 'failed'} (exit ${evidenceHelpers.exitCode})${evidenceHelpersWarningOnly ? ' [warning-only]' : ''}`
    : '- Helpers-suite evidence: not included',
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
if (evidenceHelpers?.stderr) {
  mdLines.push('', '## Helpers-suite stderr', '', '```text', evidenceHelpers.stderr, '```')
}

writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Marketing Release Gate Evidence Bundle',
  '',
  `- Last updated: ${evidence.capturedAt}`,
  `- Overall OK: ${overallOk ? 'yes' : 'no'}`,
  `- Effective OK: ${evidence.effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  `- Include helpers evidence: ${includeEvidenceHelpers ? 'yes' : 'no'}`,
  `- Helpers warning only: ${evidenceHelpersWarningOnly ? 'yes' : 'no'}`,
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
      ok: evidence.effectiveOk,
      overallOk,
      warningOnly,
      includeEvidenceHelpers,
      evidenceHelpersWarningOnly,
      jsonPath,
      markdownPath: mdPath,
      latestIndexPath,
      steps: evidence.steps,
    },
    null,
    2
  )
)

process.exit(evidence.effectiveOk ? 0 : 1)

