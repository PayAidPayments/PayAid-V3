#!/usr/bin/env node
import { resolveWarningOnlyFlag } from './lib/warning-only-flag.mjs'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

try {
  const umbrellaKey = 'MARKETING_RELEASE_GATE_EVIDENCE_WARNING_ONLY'
  const specificKey = 'MARKETING_RELEASE_GATE_PROFILE_MATRIX_EVIDENCE_WARNING_ONLY'

  // Case 1: defaults off
  assert(
    resolveWarningOnlyFlag({ env: {}, specificKey, umbrellaKey }) === false,
    'Case1 failed: default should resolve false'
  )

  // Case 2: umbrella on when specific unset
  assert(
    resolveWarningOnlyFlag({ env: { [umbrellaKey]: '1' }, specificKey, umbrellaKey }) === true,
    'Case2 failed: umbrella=1 should resolve true when specific is unset'
  )

  // Case 3: specific on overrides umbrella off
  assert(
    resolveWarningOnlyFlag({
      env: { [specificKey]: '1', [umbrellaKey]: '0' },
      specificKey,
      umbrellaKey,
    }) === true,
    'Case3 failed: specific=1 should override umbrella=0'
  )

  // Case 4: specific off overrides umbrella on
  assert(
    resolveWarningOnlyFlag({
      env: { [specificKey]: '0', [umbrellaKey]: '1' },
      specificKey,
      umbrellaKey,
    }) === false,
    'Case4 failed: specific=0 should override umbrella=1'
  )

  // Case 5: unknown specific value falls back to umbrella
  assert(
    resolveWarningOnlyFlag({
      env: { [specificKey]: 'unexpected', [umbrellaKey]: '1' },
      specificKey,
      umbrellaKey,
    }) === true,
    'Case5 failed: unexpected specific value should fall back to umbrella'
  )

  // Case 6: custom umbrella key support
  assert(
    resolveWarningOnlyFlag({
      env: { CUSTOM_UMBRELLA: '1' },
      specificKey: 'SPECIFIC_FLAG',
      umbrellaKey: 'CUSTOM_UMBRELLA',
    }) === true,
    'Case6 failed: custom umbrella key should be honored'
  )

  console.log(
    JSON.stringify(
      {
        ok: true,
        check: 'marketing-release-warning-flag-resolver',
        cases: [
          'default false',
          'umbrella fallback',
          'specific true override',
          'specific false override',
          'unexpected specific value fallback',
          'custom umbrella key support',
        ],
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
        check: 'marketing-release-warning-flag-resolver',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  )
  process.exit(1)
}

