#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const packageJsonPath =
  process.env.LEADS_BULK_RETENTION_POLICY_MIRROR_PACKAGE_JSON_PATH || join(process.cwd(), 'package.json')

if (!existsSync(packageJsonPath)) {
  console.log(
    JSON.stringify(
      {
        check: 'leads-bulk-retention-policy-mirror',
        ok: false,
        reason: 'package_json_not_found',
        packageJsonPath,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const scripts = packageJson?.scripts ?? {}

const pipelineScriptName = 'run:leads-bulk-retention-health-gate-pipeline:with-helpers:timeout-guard'
const preflightScriptName = 'run:leads-bulk-retention-health-gate:preflight:with-helpers:timeout-guard'
const preflightEvidenceScriptName =
  'run:leads-bulk-retention-health-gate:preflight:evidence:with-helpers:timeout-guard'

const requiredPipelineTokens = [
  'LEADS_BULK_RETENTION_INCLUDE_HELPERS_EVIDENCE=1',
  'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS=180000',
  'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_HELPERS_EVIDENCE=180000',
]

const requiredPreflightTokens = [
  'LEADS_BULK_RETENTION_INCLUDE_HELPERS_EVIDENCE=1',
  'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_PREFLIGHT=180000',
  'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_GATE_PIPELINE=180000',
  'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_HELPERS_EVIDENCE=180000',
]

const requiredPreflightEvidenceTokens = [
  ...requiredPreflightTokens,
  'LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_PREFLIGHT_EVIDENCE=180000',
]

function checkScript(scriptName, commandText, tokens) {
  if (typeof commandText !== 'string' || !commandText.trim()) {
    return {
      scriptName,
      exists: false,
      missingTokens: tokens,
    }
  }
  const missingTokens = tokens.filter((token) => !commandText.includes(token))
  return {
    scriptName,
    exists: true,
    missingTokens,
  }
}

const pipelineResult = checkScript(
  pipelineScriptName,
  scripts[pipelineScriptName],
  requiredPipelineTokens,
)
const preflightResult = checkScript(
  preflightScriptName,
  scripts[preflightScriptName],
  requiredPreflightTokens,
)
const preflightEvidenceResult = checkScript(
  preflightEvidenceScriptName,
  scripts[preflightEvidenceScriptName],
  requiredPreflightEvidenceTokens,
)

const ok =
  pipelineResult.missingTokens.length === 0 &&
  preflightResult.missingTokens.length === 0 &&
  preflightEvidenceResult.missingTokens.length === 0

console.log(
  JSON.stringify(
    {
      check: 'leads-bulk-retention-policy-mirror',
      ok,
      pipelineScript: pipelineResult,
      preflightScript: preflightResult,
      preflightEvidenceScript: preflightEvidenceResult,
      requiredPipelineTokens,
      requiredPreflightTokens,
      requiredPreflightEvidenceTokens,
    },
    null,
    2,
  ),
)

process.exit(ok ? 0 : 1)
