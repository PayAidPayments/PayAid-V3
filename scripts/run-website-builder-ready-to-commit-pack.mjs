import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { isWebsiteBuilderDocsAsciiGateEnabled } from './website-builder-step4-8-docs-gate.mjs'
import { buildWebsiteBuilderStep48NextAction } from './website-builder-step4-8-next-action.mjs'
import { isWebsiteBuilderHelperGateEnabled } from './website-builder-step4-8-helper-gate.mjs'
import {
  canRunWebsiteBuilderTokenProbe,
  hasWebsiteBuilderAuthTokenBlocker,
  resolveNextActionStepsWithTokenProbe,
  runWebsiteBuilderTokenHelperJsonProbe,
} from './website-builder-step4-8-token-probe.mjs'

const STEPS = [
  ['evidence-pipeline', ['run', 'run:website-builder-step4-8-evidence-pipeline']],
  ['ready-to-commit-preflight', ['run', 'check:website-builder-ready-to-commit']],
]
const INCLUDE_HELPER_TESTS = isWebsiteBuilderHelperGateEnabled(process.env)
const INCLUDE_DOCS_ASCII_CHECK = isWebsiteBuilderDocsAsciiGateEnabled(process.env)

function runStep(label, args) {
  const started = Date.now()
  const run = spawnSync('npm', args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  const elapsedMs = Date.now() - started
  const exitCode = typeof run.status === 'number' ? run.status : 1
  return {
    label,
    command: `npm ${args.join(' ')}`,
    ok: exitCode === 0,
    exitCode,
    elapsedMs,
    stdout: run.stdout || '',
    stderr: run.stderr || '',
  }
}

function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null
  const match = text.match(/(\{[\s\S]*\})\s*$/)
  const candidate = match ? match[1] : text
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

const results = []
for (const [label, args] of STEPS) {
  const result = runStep(label, args)
  results.push(result)
}
const helperTestsResult = INCLUDE_HELPER_TESTS
  ? runStep('helper-tests', ['run', 'test:website-builder-step4-8-helpers'])
  : null
const docsAsciiCheckResult = INCLUDE_DOCS_ASCII_CHECK
  ? runStep('docs-ascii-safety', ['run', 'check:docs:ascii-safety'])
  : null

const overallOk =
  results.length === STEPS.length &&
  results.every((result) => result.ok) &&
  (helperTestsResult ? helperTestsResult.ok : true) &&
  (docsAsciiCheckResult ? docsAsciiCheckResult.ok : true)
const evidencePipeline = results.find((step) => step.label === 'evidence-pipeline')
const evidencePipelinePayload = evidencePipeline ? tryParseJson(evidencePipeline.stdout) : null
const preflight = results.find((step) => step.label === 'ready-to-commit-preflight')
const preflightPayload = preflight ? tryParseJson(preflight.stdout) : null
const preflightChecks = Array.isArray(preflightPayload?.checks) ? preflightPayload.checks : []
const markerCheck = preflightChecks.find((c) => c.id === 'template:discoverability')
const evidenceCheck = preflightChecks.find((c) => c.id === 'template:discoverability-evidence')
const runtimeJsonCheck = preflightChecks.find((c) => c.id === 'artifact:runtime-json')

let runtimeBlockers = null
if (typeof runtimeJsonCheck?.detail === 'string' && runtimeJsonCheck.detail !== 'missing') {
  try {
    const runtimeArtifactPath = path.isAbsolute(runtimeJsonCheck.detail)
      ? runtimeJsonCheck.detail
      : path.join(process.cwd(), runtimeJsonCheck.detail)
    const runtimePayload = JSON.parse(readFileSync(runtimeArtifactPath, 'utf8'))
    runtimeBlockers = Array.isArray(runtimePayload?.blockedReasons) ? runtimePayload.blockedReasons : null
  } catch {
    runtimeBlockers = null
  }
}

const remediation = buildWebsiteBuilderStep48NextAction({
  runtimeBlockers,
  rerunCommand: 'npm run run:website-builder-ready-to-commit-pack',
})
const hasMissingAuthToken = hasWebsiteBuilderAuthTokenBlocker(runtimeBlockers)
const canProbeTokenHelper = hasMissingAuthToken && canRunWebsiteBuilderTokenProbe(process.env)
const tokenHelperProbe = canProbeTokenHelper ? runWebsiteBuilderTokenHelperJsonProbe() : null
const resolvedNextActionSteps = resolveNextActionStepsWithTokenProbe({
  tokenHelperProbe,
  remediationSteps: remediation.nextActionSteps,
  rerunCommand: 'npm run run:website-builder-ready-to-commit-pack',
})

console.log(
  JSON.stringify(
    {
      check: 'website-builder-ready-to-commit-pack',
      overallOk,
      discoverabilityGate: {
        markerCheck: markerCheck
          ? { ok: markerCheck.ok, detail: markerCheck.detail }
          : { ok: null, detail: 'not available (preflight did not run or no JSON output)' },
        evidenceCheck: evidenceCheck
          ? { ok: evidenceCheck.ok, detail: evidenceCheck.detail }
          : { ok: null, detail: 'not available (preflight did not run or no JSON output)' },
      },
      evidencePipelineGate: evidencePipelinePayload?.discoverabilityGate || null,
      runtimeBlockers,
      nextAction: remediation.nextAction,
      nextActionSteps: resolvedNextActionSteps,
      tokenHelperProbe,
      helperTests: helperTestsResult
        ? {
            enabled: true,
            ok: helperTestsResult.ok,
            command: helperTestsResult.command,
            exitCode: helperTestsResult.exitCode,
            elapsedMs: helperTestsResult.elapsedMs,
          }
        : {
            enabled: false,
            ok: null,
            command: 'npm run test:website-builder-step4-8-helpers',
            note: 'Set WEBSITE_BUILDER_INCLUDE_HELPER_TESTS=1 to include helper tests in pack gating.',
          },
      docsAsciiCheck: docsAsciiCheckResult
        ? {
            enabled: true,
            ok: docsAsciiCheckResult.ok,
            command: docsAsciiCheckResult.command,
            exitCode: docsAsciiCheckResult.exitCode,
            elapsedMs: docsAsciiCheckResult.elapsedMs,
          }
        : {
            enabled: false,
            ok: null,
            command: 'npm run check:docs:ascii-safety',
            note: 'Set WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK=1 to include docs ASCII safety in pack gating.',
          },
      steps: results,
      note: overallOk
        ? 'Website Builder evidence pipeline and commit preflight passed.'
        : 'One or more steps failed. Review step outputs and generated artifacts.',
    },
    null,
    2
  )
)

process.exitCode = overallOk ? 0 : 1
