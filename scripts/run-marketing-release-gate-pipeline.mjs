#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function runStep(label, command, args, env = process.env) {
  const startedAt = Date.now()
  const result = spawnSync(command, args, {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  return {
    label,
    command: [command, ...args].join(' '),
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  }
}

const env = { ...process.env, MARKETING_RELEASE_CLOSURE_STRICT: '1' }
const includeMarkerHelpers =
  process.env.MARKETING_RELEASE_INCLUDE_MARKER_HELPERS === '1'
const markerHelpersWarningOnly =
  process.env.MARKETING_RELEASE_MARKER_HELPERS_WARNING_ONLY === '1'
const includeMarkerVerifier =
  process.env.MARKETING_RELEASE_INCLUDE_MARKER_VERIFIER === '1'
const markerVerifierWarningOnly =
  process.env.MARKETING_RELEASE_MARKER_VERIFIER_WARNING_ONLY === '1'
const includeMatrixEvidence =
  process.env.MARKETING_RELEASE_INCLUDE_MATRIX_EVIDENCE === '1'
const matrixEvidenceWarningOnly =
  process.env.MARKETING_RELEASE_MATRIX_EVIDENCE_WARNING_ONLY === '1'

const steps = [
  runStep('social-smoke-evidence', process.execPath, ['scripts/run-social-oauth-smoke-evidence.mjs'], env),
  runStep(
    'social-smoke-handoff-snippet',
    process.execPath,
    ['scripts/generate-social-oauth-smoke-handoff-snippet.mjs'],
    env
  ),
  runStep(
    'marketing-closure-pack-strict',
    process.execPath,
    ['scripts/run-marketing-release-closure-pack.mjs'],
    env
  ),
]

if (includeMarkerHelpers) {
  steps.push(
    runStep(
      'marker-helpers-suite',
      process.execPath,
      ['scripts/run-marker-helpers-suite.mjs'],
      env
    )
  )
}

if (includeMarkerVerifier) {
  steps.push(
    runStep(
      'marker-gate-verifier',
      process.execPath,
      ['scripts/verify-marketing-release-gate-marker.mjs'],
      env
    )
  )
}

if (includeMatrixEvidence) {
  steps.push(
    runStep(
      'marketing-gate-profile-matrix-evidence',
      process.execPath,
      ['scripts/run-marketing-release-gate-profile-matrix-evidence.mjs'],
      env
    )
  )
}

const evaluatedSteps = steps.map((s) => {
  const warningOnly =
    (s.label === 'marker-helpers-suite' && markerHelpersWarningOnly) ||
    (s.label === 'marker-gate-verifier' && markerVerifierWarningOnly) ||
    (s.label === 'marketing-gate-profile-matrix-evidence' && matrixEvidenceWarningOnly)
  return {
    ...s,
    warningOnly,
    effectiveOk: warningOnly ? true : s.ok,
  }
})

const overallOk = evaluatedSteps.every((s) => s.effectiveOk)
const output = {
  check: 'marketing-release-gate-pipeline',
  overallOk,
  includeMarkerHelpers,
  markerHelpersWarningOnly,
  includeMarkerVerifier,
  markerVerifierWarningOnly,
  includeMatrixEvidence,
  matrixEvidenceWarningOnly,
  steps: steps.map((s) => ({
    label: s.label,
    ok: s.ok,
    effectiveOk: evaluatedSteps.find((x) => x.label === s.label)?.effectiveOk ?? s.ok,
    warningOnly: evaluatedSteps.find((x) => x.label === s.label)?.warningOnly ?? false,
    exitCode: s.exitCode,
    elapsedMs: s.elapsedMs,
    command: s.command,
  })),
}

console.log(JSON.stringify(output, null, 2))

if (overallOk) {
  const closureDir = join(process.cwd(), 'docs', 'evidence', 'closure')
  const markerDir = join(closureDir, 'markers')
  mkdirSync(markerDir, { recursive: true })
  const markerPath = join(markerDir, 'marketing-release-gate-green.json')
  writeFileSync(
    markerPath,
    `${JSON.stringify(
      {
        check: output.check,
        overallOk: true,
        generatedAt: new Date().toISOString(),
        steps: output.steps,
      },
      null,
      2
    )}\n`,
    'utf8'
  )
  console.log(JSON.stringify({ markerPath }, null, 2))
}

if (!overallOk) {
  const failed = evaluatedSteps.find((s) => !s.effectiveOk)
  if (failed) {
    if (failed.stdout) {
      console.error('\n# Failed step stdout')
      console.error(failed.stdout)
    }
    if (failed.stderr) {
      console.error('\n# Failed step stderr')
      console.error(failed.stderr)
    }
  }
}

process.exit(overallOk ? 0 : 1)

