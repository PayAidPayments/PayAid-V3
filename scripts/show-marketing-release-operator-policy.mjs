#!/usr/bin/env node
import { resolveTimeoutMs } from './lib/timeout-helpers.mjs'
import { resolveWarningOnlyFlag } from './lib/warning-only-flag.mjs'

const env = process.env

const rolloutVerificationWarningOnly =
  env.MARKETING_RELEASE_PRODUCTION_VERIFICATION_WARNING_ONLY === '1'
const bundleWarningOnly = resolveWarningOnlyFlag({
  env,
  specificKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_WARNING_ONLY',
})
const helpersWarningOnly = resolveWarningOnlyFlag({
  env,
  specificKey: 'MARKETING_RELEASE_EVIDENCE_HELPERS_WARNING_ONLY',
})
const latencyGateWarningOnly = resolveWarningOnlyFlag({
  env,
  specificKey: 'MARKETING_RELEASE_EVIDENCE_LATENCY_GATE_WARNING_ONLY',
})

const policy = {
  check: 'marketing-release-operator-policy',
  capturedAt: new Date().toISOString(),
  warningOnly: {
    umbrella: env.MARKETING_RELEASE_GATE_EVIDENCE_WARNING_ONLY === '1',
    rolloutVerification: rolloutVerificationWarningOnly,
    bundle: bundleWarningOnly,
    helpers: helpersWarningOnly,
    latencyGate: latencyGateWarningOnly,
  },
  includeFlags: {
    evidenceHelpers: env.MARKETING_RELEASE_INCLUDE_EVIDENCE_HELPERS === '1',
    latencyGate: env.MARKETING_RELEASE_INCLUDE_EVIDENCE_LATENCY_GATE === '1',
  },
  timeoutMs: {
    bundleGlobal: resolveTimeoutMs({
      env,
      globalKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS',
    }),
    matrix: resolveTimeoutMs({
      env,
      globalKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS_MATRIX',
    }),
    verdict: resolveTimeoutMs({
      env,
      globalKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS_VERDICT',
    }),
    helpers: resolveTimeoutMs({
      env,
      globalKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS_HELPERS',
    }),
    latencyGate: resolveTimeoutMs({
      env,
      globalKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS',
      specificKey: 'MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS_LATENCY_GATE',
    }),
  },
}

console.log(JSON.stringify(policy, null, 2))

