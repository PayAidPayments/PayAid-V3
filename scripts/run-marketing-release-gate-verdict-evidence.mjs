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

const pipelineRun = spawnSync(process.execPath, ['scripts/run-marketing-release-gate-pipeline.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
})

const pipelineStdout = (pipelineRun.stdout || '').trim()
const pipelineStderr = (pipelineRun.stderr || '').trim()
const pipelineParsed = parseJsonSafely(pipelineStdout)

const explainRun = spawnSync(process.execPath, ['scripts/explain-marketing-gate-verdict.mjs'], {
  env: { ...process.env },
  input: pipelineStdout,
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'pipe'],
})

const explainStdout = (explainRun.stdout || '').trim()
const explainStderr = (explainRun.stderr || '').trim()
const explainParsed = parseJsonSafely(explainStdout)
const warningOnly = resolveWarningOnlyFlag({
  specificKey: 'MARKETING_RELEASE_GATE_VERDICT_EVIDENCE_WARNING_ONLY',
})
const overallOk =
  Boolean(pipelineParsed?.overallOk) &&
  explainRun.status === 0 &&
  Boolean(explainParsed?.ok)
const effectiveOk = warningOnly ? true : overallOk

const now = new Date()
const stamp = isoForFile(now)
const outDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })

const jsonPath = join(outDir, `${stamp}-marketing-release-gate-verdict-evidence.json`)
const mdPath = join(outDir, `${stamp}-marketing-release-gate-verdict-evidence.md`)
const latestIndexPath = join(outDir, 'latest-marketing-release-gate-verdict-evidence.md')

const evidence = {
  check: 'marketing-release-gate-verdict-evidence',
  capturedAt: now.toISOString(),
  command: 'npm run run:marketing-release-gate-verdict-evidence',
  warningOnly,
  overallOk,
  effectiveOk,
  pipeline: {
    exitCode: pipelineRun.status ?? 1,
    ok: Boolean(pipelineParsed?.overallOk),
    parsed: pipelineParsed ?? null,
    stdout: pipelineStdout,
    stderr: pipelineStderr,
  },
  explainer: {
    exitCode: explainRun.status ?? 1,
    ok: explainRun.status === 0 && Boolean(explainParsed?.ok),
    parsed: explainParsed ?? null,
    stdout: explainStdout,
    stderr: explainStderr,
  },
}

writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

const mdLines = [
  '# Marketing Release Gate Verdict Evidence',
  '',
  `- Captured at: ${evidence.capturedAt}`,
  `- Command: \`${evidence.command}\``,
  `- Pipeline exit code: ${evidence.pipeline.exitCode}`,
  `- Pipeline overall OK: ${evidence.pipeline.ok ? 'yes' : 'no'}`,
  `- Verdict explainer OK: ${evidence.explainer.ok ? 'yes' : 'no'}`,
  `- Effective OK: ${effectiveOk ? 'yes' : 'no'}`,
  `- Warning only mode: ${warningOnly ? 'yes' : 'no'}`,
  '',
  '## Pipeline Summary JSON',
  '',
  '```json',
  pipelineParsed
    ? JSON.stringify(pipelineParsed, null, 2)
    : JSON.stringify(
        { parseError: 'Pipeline output was not valid JSON', stdout: pipelineStdout },
        null,
        2
      ),
  '```',
  '',
  '## Verdict Explainer JSON',
  '',
  '```json',
  explainParsed
    ? JSON.stringify(explainParsed, null, 2)
    : JSON.stringify(
        { parseError: 'Explainer output was not valid JSON', stdout: explainStdout },
        null,
        2
      ),
  '```',
]

if (pipelineStderr) {
  mdLines.push('', '## Pipeline stderr', '', '```text', pipelineStderr, '```')
}
if (explainStderr) {
  mdLines.push('', '## Explainer stderr', '', '```text', explainStderr, '```')
}

writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Marketing Release Gate Verdict Evidence',
  '',
  `- Last updated: ${evidence.capturedAt}`,
  `- Pipeline overall OK: ${evidence.pipeline.ok ? 'yes' : 'no'}`,
  `- Pipeline exit code: ${evidence.pipeline.exitCode}`,
  `- Verdict reason: ${pipelineParsed?.verdictReason || 'unknown'}`,
  `- Explainer status: ${evidence.explainer.ok ? 'ok' : 'failed'}`,
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
  '- `npm run run:marketing-release-gate-verdict-evidence`',
]
writeFileSync(latestIndexPath, `${latestLines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: effectiveOk,
      overallOk,
      warningOnly,
      pipelineOk: evidence.pipeline.ok,
      pipelineExitCode: evidence.pipeline.exitCode,
      verdictReason: pipelineParsed?.verdictReason || null,
      explainerOk: evidence.explainer.ok,
      jsonPath,
      markdownPath: mdPath,
      latestIndexPath,
    },
    null,
    2
  )
)

process.exit(effectiveOk ? 0 : pipelineRun.status ?? 1)

