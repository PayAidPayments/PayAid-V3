import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { buildWebsiteBuilderStep48NextAction } from './website-builder-step4-8-next-action.mjs'
import {
  isWebsiteBuilderDocsAsciiGateEnabled,
  isWebsiteBuilderFlagParserTestsGateEnabled,
  isWebsiteBuilderHelperContractCheckGateEnabled,
  isWebsiteBuilderHelperGateEnabled,
} from './website-builder-step4-8-gates.mjs'
import {
  canRunWebsiteBuilderTokenProbe,
  hasWebsiteBuilderAuthTokenBlocker,
  resolveNextActionStepsWithTokenProbe,
  runWebsiteBuilderTokenHelperJsonProbe,
} from './website-builder-step4-8-token-probe.mjs'

const CHECK_CMD = ['run', 'check:website-builder-step4-8-runtime']
const APPLY_CMD = ['run', 'apply:website-builder-step4-8-runtime-artifact']
const INCLUDE_HELPER_TESTS = isWebsiteBuilderHelperGateEnabled(process.env)
const INCLUDE_DOCS_ASCII_CHECK = isWebsiteBuilderDocsAsciiGateEnabled(process.env)
const INCLUDE_FLAG_PARSER_TESTS = isWebsiteBuilderFlagParserTestsGateEnabled(process.env)
const INCLUDE_HELPER_CONTRACT_CHECK = isWebsiteBuilderHelperContractCheckGateEnabled(process.env)

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
    exitCode,
    ok: exitCode === 0,
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

const check = runStep('check', CHECK_CMD)
const apply = runStep('apply', APPLY_CMD)
const helperTestsResult = INCLUDE_HELPER_TESTS
  ? runStep('helper-tests', ['run', 'test:website-builder-step4-8-helpers'])
  : null
const docsAsciiCheckResult = INCLUDE_DOCS_ASCII_CHECK
  ? runStep('docs-ascii-safety', ['run', 'check:docs:ascii-safety'])
  : null
const flagParserTestsResult = INCLUDE_FLAG_PARSER_TESTS
  ? runStep('flag-parser-tests', ['run', 'test:flag-parsers'])
  : null
const helperContractCheckResult = INCLUDE_HELPER_CONTRACT_CHECK
  ? runStep('helper-contract-check', ['run', 'validate:website-builder-helper-test-contract'])
  : null

const overallOk =
  check.ok &&
  apply.ok &&
  (helperTestsResult ? helperTestsResult.ok : true) &&
  (docsAsciiCheckResult ? docsAsciiCheckResult.ok : true) &&
  (flagParserTestsResult ? flagParserTestsResult.ok : true) &&
  (helperContractCheckResult ? helperContractCheckResult.ok : true)
const checkPayload = tryParseJson(check.stdout)
let runtimeChecks = Array.isArray(checkPayload?.checks) ? checkPayload.checks : []
let runtimePayloadFromArtifact = null
if (runtimeChecks.length === 0 && checkPayload?.jsonPath) {
  try {
    const runtimeArtifactPath = path.isAbsolute(checkPayload.jsonPath)
      ? checkPayload.jsonPath
      : path.join(process.cwd(), checkPayload.jsonPath)
    runtimePayloadFromArtifact = JSON.parse(readFileSync(runtimeArtifactPath, 'utf8'))
    runtimeChecks = Array.isArray(runtimePayloadFromArtifact?.checks) ? runtimePayloadFromArtifact.checks : []
  } catch {
    runtimeChecks = []
  }
}
const discoverabilityGate = runtimeChecks.find((c) => c.id === 'G')
const runtimeBlockers = Array.isArray(checkPayload?.blockedReasons)
  ? checkPayload.blockedReasons
  : Array.isArray(runtimePayloadFromArtifact?.blockedReasons)
    ? runtimePayloadFromArtifact.blockedReasons
    : null
const hasMissingAuthToken = hasWebsiteBuilderAuthTokenBlocker(runtimeBlockers)
const canProbeTokenHelper = hasMissingAuthToken && canRunWebsiteBuilderTokenProbe(process.env)
const tokenHelperProbe = canProbeTokenHelper ? runWebsiteBuilderTokenHelperJsonProbe() : null
const remediation = buildWebsiteBuilderStep48NextAction({
  runtimeBlockers,
  rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
})
const resolvedNextActionSteps = resolveNextActionStepsWithTokenProbe({
  tokenHelperProbe,
  remediationSteps: remediation.nextActionSteps,
  rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
})
const summary = {
  overallOk,
  discoverabilityGate: discoverabilityGate
    ? {
        ok: discoverabilityGate.pass,
        status: discoverabilityGate.status,
        details: discoverabilityGate.details || null,
      }
    : {
        ok: null,
        status: null,
        details: 'not available (runtime check did not return JSON checks payload)',
      },
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
        note: 'Set WEBSITE_BUILDER_INCLUDE_HELPER_TESTS=1 to include helper tests in pipeline gating.',
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
        note: 'Set WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK=1 to include docs ASCII safety in pipeline gating.',
      },
  flagParserTests: flagParserTestsResult
    ? {
        enabled: true,
        ok: flagParserTestsResult.ok,
        command: flagParserTestsResult.command,
        exitCode: flagParserTestsResult.exitCode,
        elapsedMs: flagParserTestsResult.elapsedMs,
      }
    : {
        enabled: false,
        ok: null,
        command: 'npm run test:flag-parsers',
        note: 'Set WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS=1 to include flag parser tests in pipeline gating.',
      },
  helperContractCheck: helperContractCheckResult
    ? {
        enabled: true,
        ok: helperContractCheckResult.ok,
        command: helperContractCheckResult.command,
        exitCode: helperContractCheckResult.exitCode,
        elapsedMs: helperContractCheckResult.elapsedMs,
      }
    : {
        enabled: false,
        ok: null,
        command: 'npm run validate:website-builder-helper-test-contract',
        note: 'Set WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK=1 to include helper contract validation in pipeline gating.',
      },
  steps: [
    {
      label: check.label,
      command: check.command,
      ok: check.ok,
      exitCode: check.exitCode,
      elapsedMs: check.elapsedMs,
    },
    {
      label: apply.label,
      command: apply.command,
      ok: apply.ok,
      exitCode: apply.exitCode,
      elapsedMs: apply.elapsedMs,
    },
  ],
  note: overallOk
    ? 'Website Builder Step 4.8 runtime checks passed and evidence template was auto-updated.'
    : 'One or more steps failed. Evidence template may still contain useful blocked/fail details.',
}

console.log(JSON.stringify(summary, null, 2))
process.exitCode = overallOk ? 0 : 1
