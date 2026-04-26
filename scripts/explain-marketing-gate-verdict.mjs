#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return null
  return process.argv[idx + 1] || null
}

function readInputText() {
  const inputPathArg = getArgValue('--input')
  if (inputPathArg) {
    const resolved = path.resolve(process.cwd(), inputPathArg)
    if (!existsSync(resolved)) {
      throw new Error(`Input file not found: ${resolved}`)
    }
    return readFileSync(resolved, 'utf8')
  }

  if (!process.stdin.isTTY) {
    return readFileSync(0, 'utf8')
  }

  throw new Error('Provide --input <pipeline-json-path> or pipe JSON via stdin.')
}

function remediationFor(verdictReason, failedStep) {
  if (verdictReason === 'failed_required_step') {
    return {
      severity: 'blocking',
      message: 'Required release-gate stage failed; release should remain blocked.',
      nextSteps: [
        failedStep?.timedOut
          ? `Increase step timeout and retry: set step-specific timeout for "${failedStep.label}".`
          : 'Inspect failed step stdout/stderr and resolve root cause.',
        'Re-run gate pipeline after fix.',
      ],
    }
  }
  if (verdictReason === 'failed_nonrequired_step') {
    return {
      severity: 'blocking',
      message: 'A non-required but non-warning stage failed.',
      nextSteps: [
        'Confirm whether the step should be warning-only.',
        'Fix underlying issue or adjust gate policy.',
        'Re-run gate pipeline.',
      ],
    }
  }
  if (verdictReason === 'warning_only_failures_only') {
    return {
      severity: 'warning',
      message: 'Only warning-only stages failed; gate remains passable.',
      nextSteps: [
        'Review warning-only stage failures for follow-up.',
        'Track remediation in release notes backlog.',
      ],
    }
  }
  if (verdictReason === 'all_required_passed_optional_skipped') {
    return {
      severity: 'warning',
      message: 'Required stages passed; optional stages were intentionally skipped.',
      nextSteps: [
        'Confirm skip policy (`MARKETING_RELEASE_SKIP_OPTIONAL_AFTER_FAILURE=1`) was intentional.',
        'Optionally run optional stages separately for observability.',
      ],
    }
  }
  return {
    severity: 'ok',
    message: 'All stages passed.',
    nextSteps: ['Proceed with downstream release verification steps.'],
  }
}

try {
  const raw = readInputText().trim()
  const parsed = JSON.parse(raw)

  const steps = Array.isArray(parsed?.steps) ? parsed.steps : []
  const failedStep =
    steps.find((s) => s?.effectiveOk === false) ||
    steps.find((s) => s?.ok === false) ||
    null
  const verdictReason = parsed?.verdictReason || 'unknown'
  const remediation = remediationFor(verdictReason, failedStep)

  console.log(
    JSON.stringify(
      {
        ok: true,
        check: 'marketing-release-gate-verdict-explainer',
        overallOk: Boolean(parsed?.overallOk),
        verdictReason,
        summary: remediation.message,
        severity: remediation.severity,
        failedStep: failedStep
          ? {
              label: failedStep.label || null,
              timedOut: Boolean(failedStep.timedOut),
              skipReason: failedStep.skipReason || null,
            }
          : null,
        nextSteps: remediation.nextSteps,
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        check: 'marketing-release-gate-verdict-explainer',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  )
  process.exit(1)
}

