#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function parseTimeoutMs(value, fallbackMs) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMs
  return parsed
}

function resolveStepTimeoutMs(label) {
  const globalTimeoutMs = parseTimeoutMs(
    process.env.MARKETING_RELEASE_STEP_TIMEOUT_MS,
    300000
  )

  if (label === 'social-smoke-evidence') {
    return parseTimeoutMs(
      process.env.MARKETING_RELEASE_STEP_TIMEOUT_MS_SOCIAL_SMOKE_EVIDENCE,
      globalTimeoutMs
    )
  }
  if (label === 'social-smoke-handoff-snippet') {
    return parseTimeoutMs(
      process.env.MARKETING_RELEASE_STEP_TIMEOUT_MS_SOCIAL_SMOKE_HANDOFF_SNIPPET,
      globalTimeoutMs
    )
  }
  if (label === 'marketing-closure-pack-strict') {
    return parseTimeoutMs(
      process.env.MARKETING_RELEASE_STEP_TIMEOUT_MS_MARKETING_CLOSURE_PACK_STRICT,
      globalTimeoutMs
    )
  }
  if (label === 'marker-helpers-suite') {
    return parseTimeoutMs(
      process.env.MARKETING_RELEASE_STEP_TIMEOUT_MS_MARKER_HELPERS_SUITE,
      globalTimeoutMs
    )
  }
  if (label === 'marker-gate-verifier') {
    return parseTimeoutMs(
      process.env.MARKETING_RELEASE_STEP_TIMEOUT_MS_MARKER_GATE_VERIFIER,
      globalTimeoutMs
    )
  }
  if (label === 'marketing-gate-profile-matrix-evidence') {
    return parseTimeoutMs(
      process.env.MARKETING_RELEASE_STEP_TIMEOUT_MS_MARKETING_GATE_PROFILE_MATRIX_EVIDENCE,
      globalTimeoutMs
    )
  }
  return globalTimeoutMs
}

function runStep(label, command, args, env = process.env) {
  const startedAt = Date.now()
  const timeoutMs = resolveStepTimeoutMs(label)
  const result = spawnSync(command, args, {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: timeoutMs,
  })
  const timedOut = result.error?.name === 'Error' && result.error?.code === 'ETIMEDOUT'
  const baseStderr = (result.stderr || '').trim()
  const timeoutSuffix = timedOut ? `Step "${label}" timed out after ${timeoutMs}ms.` : ''
  const mergedStderr = [baseStderr, timeoutSuffix].filter(Boolean).join('\n')

  return {
    label,
    command: [command, ...args].join(' '),
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    timeoutMs,
    timedOut,
    stdout: (result.stdout || '').trim(),
    stderr: mergedStderr,
  }
}

const env = { ...process.env, MARKETING_RELEASE_CLOSURE_STRICT: '1' }
const skipOptionalAfterFailure =
  process.env.MARKETING_RELEASE_SKIP_OPTIONAL_AFTER_FAILURE === '1'
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

function isWarningOnlyLabel(label) {
  return (
    (label === 'marker-helpers-suite' && markerHelpersWarningOnly) ||
    (label === 'marker-gate-verifier' && markerVerifierWarningOnly) ||
    (label === 'marketing-gate-profile-matrix-evidence' && matrixEvidenceWarningOnly)
  )
}

const stepDefs = [
  {
    label: 'social-smoke-evidence',
    command: process.execPath,
    args: ['scripts/run-social-oauth-smoke-evidence.mjs'],
    optional: false,
  },
  {
    label: 'social-smoke-handoff-snippet',
    command: process.execPath,
    args: ['scripts/generate-social-oauth-smoke-handoff-snippet.mjs'],
    optional: false,
  },
  {
    label: 'marketing-closure-pack-strict',
    command: process.execPath,
    args: ['scripts/run-marketing-release-closure-pack.mjs'],
    optional: false,
  },
]

if (includeMarkerHelpers) {
  stepDefs.push(
    {
      label: 'marker-helpers-suite',
      command: process.execPath,
      args: ['scripts/run-marker-helpers-suite.mjs'],
      optional: true,
    }
  )
}

if (includeMarkerVerifier) {
  stepDefs.push(
    {
      label: 'marker-gate-verifier',
      command: process.execPath,
      args: ['scripts/verify-marketing-release-gate-marker.mjs'],
      optional: true,
    }
  )
}

if (includeMatrixEvidence) {
  stepDefs.push(
    {
      label: 'marketing-gate-profile-matrix-evidence',
      command: process.execPath,
      args: ['scripts/run-marketing-release-gate-profile-matrix-evidence.mjs'],
      optional: true,
    }
  )
}

const steps = []
let hasBlockingFailure = false

for (const def of stepDefs) {
  if (skipOptionalAfterFailure && hasBlockingFailure && def.optional) {
    steps.push({
      label: def.label,
      command: [def.command, ...def.args].join(' '),
      ok: null,
      exitCode: null,
      elapsedMs: 0,
      timeoutMs: resolveStepTimeoutMs(def.label),
      timedOut: false,
      skipped: true,
      skipReason: 'skipped_optional_after_prior_failure',
      stdout: '',
      stderr: '',
    })
    continue
  }

  const stepResult = runStep(def.label, def.command, def.args, env)
  steps.push({
    ...stepResult,
    skipped: false,
    skipReason: null,
  })

  if (!stepResult.ok && !isWarningOnlyLabel(def.label)) {
    hasBlockingFailure = true
  }
}

const evaluatedSteps = steps.map((s) => {
  const warningOnly = isWarningOnlyLabel(s.label)
  const effectiveOkFromSkip = s.skipped ? true : s.ok
  return {
    ...s,
    warningOnly,
    effectiveOk: warningOnly ? true : effectiveOkFromSkip,
  }
})

const overallOk = evaluatedSteps.every((s) => s.effectiveOk)
const hasFailedRequiredStep = evaluatedSteps.some(
  (s) => !s.warningOnly && !s.skipped && s.ok === false
)
const hasWarningOnlyFailures = evaluatedSteps.some((s) => s.warningOnly && s.ok === false)
const hasSkippedOptionalSteps = evaluatedSteps.some((s) => s.skipped)
const hasAnyHardFailure = evaluatedSteps.some((s) => !s.effectiveOk)

function getVerdictReason() {
  if (hasAnyHardFailure && hasFailedRequiredStep) {
    return 'failed_required_step'
  }
  if (hasAnyHardFailure) {
    return 'failed_nonrequired_step'
  }
  if (hasWarningOnlyFailures) {
    return 'warning_only_failures_only'
  }
  if (hasSkippedOptionalSteps) {
    return 'all_required_passed_optional_skipped'
  }
  return 'all_steps_passed'
}

const verdictReason = getVerdictReason()

const output = {
  check: 'marketing-release-gate-pipeline',
  overallOk,
  verdictReason,
  stepTimeoutDefaults: {
    global: resolveStepTimeoutMs('default'),
    socialSmokeEvidence: resolveStepTimeoutMs('social-smoke-evidence'),
    socialSmokeHandoffSnippet: resolveStepTimeoutMs('social-smoke-handoff-snippet'),
    marketingClosurePackStrict: resolveStepTimeoutMs('marketing-closure-pack-strict'),
    markerHelpersSuite: resolveStepTimeoutMs('marker-helpers-suite'),
    markerGateVerifier: resolveStepTimeoutMs('marker-gate-verifier'),
    marketingGateProfileMatrixEvidence: resolveStepTimeoutMs(
      'marketing-gate-profile-matrix-evidence'
    ),
  },
  includeMarkerHelpers,
  markerHelpersWarningOnly,
  includeMarkerVerifier,
  markerVerifierWarningOnly,
  includeMatrixEvidence,
  matrixEvidenceWarningOnly,
  skipOptionalAfterFailure,
  steps: steps.map((s) => ({
    label: s.label,
    ok: s.ok,
    effectiveOk: evaluatedSteps.find((x) => x.label === s.label)?.effectiveOk ?? s.ok,
    warningOnly: evaluatedSteps.find((x) => x.label === s.label)?.warningOnly ?? false,
    skipped: s.skipped ?? false,
    skipReason: s.skipReason ?? null,
    exitCode: s.exitCode,
    elapsedMs: s.elapsedMs,
    timeoutMs: s.timeoutMs,
    timedOut: s.timedOut,
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

