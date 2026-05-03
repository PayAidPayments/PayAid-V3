#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const packageJsonPath =
  process.env.MARKETING_RELEASE_POLICY_MIRROR_PACKAGE_JSON_PATH ||
  join(process.cwd(), 'package.json')
if (!existsSync(packageJsonPath)) {
  console.log(
    JSON.stringify(
      {
        check: 'marketing-release-policy-mirror',
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

const rolloutScriptName = 'run:marketing-release-production-rollout-verification:warn:timeout-guard'
const preflightScriptName = 'show:marketing-release-operator-policy:rollout-warn-timeout-guard'

const requiredTokens = [
  'MARKETING_RELEASE_PRODUCTION_VERIFICATION_WARNING_ONLY=1',
  'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS=300000',
  'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS_EVIDENCE_HELPERS_SUITE=600000',
  'MARKETING_RELEASE_PRODUCTION_VERIFICATION_TIMEOUT_MS_EVIDENCE_BUNDLE=600000',
  'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS=180000',
  'MARKETING_RELEASE_EVIDENCE_HELPERS_SUITE_STEP_TIMEOUT_MS=180000',
  'MARKETING_RELEASE_INCLUDE_EVIDENCE_HELPERS=1',
  'MARKETING_RELEASE_INCLUDE_EVIDENCE_LATENCY_GATE=1',
  'MARKETING_RELEASE_EVIDENCE_HELPERS_WARNING_ONLY=1',
  'MARKETING_RELEASE_EVIDENCE_LATENCY_GATE_WARNING_ONLY=1',
]

function checkScript(scriptName, commandText) {
  if (typeof commandText !== 'string' || !commandText.trim()) {
    return {
      scriptName,
      exists: false,
      missingTokens: requiredTokens,
    }
  }
  const missingTokens = requiredTokens.filter((token) => !commandText.includes(token))
  return {
    scriptName,
    exists: true,
    missingTokens,
  }
}

const rolloutResult = checkScript(rolloutScriptName, scripts[rolloutScriptName])
const preflightResult = checkScript(preflightScriptName, scripts[preflightScriptName])
const missingAcrossEither = [...rolloutResult.missingTokens, ...preflightResult.missingTokens]
const ok = missingAcrossEither.length === 0

console.log(
  JSON.stringify(
    {
      check: 'marketing-release-policy-mirror',
      ok,
      rolloutScript: rolloutResult,
      preflightScript: preflightResult,
      requiredTokens,
    },
    null,
    2,
  ),
)

process.exit(ok ? 0 : 1)

