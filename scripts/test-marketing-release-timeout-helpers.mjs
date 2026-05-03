#!/usr/bin/env node
import { enrichTimeoutResult, parseTimeoutMs, resolveTimeoutMs } from './lib/timeout-helpers.mjs'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

try {
  // parseTimeoutMs coverage
  assert(parseTimeoutMs('5000', 1000) === 5000, 'Case1 failed: valid timeout should parse')
  assert(parseTimeoutMs('0', 1000) === 1000, 'Case2 failed: zero should fallback')
  assert(parseTimeoutMs('-10', 1000) === 1000, 'Case3 failed: negative should fallback')
  assert(parseTimeoutMs('abc', 1000) === 1000, 'Case4 failed: NaN should fallback')

  // resolveTimeoutMs coverage
  assert(
    resolveTimeoutMs({
      env: { GLOBAL_TIMEOUT: '7000' },
      globalKey: 'GLOBAL_TIMEOUT',
      fallbackMs: 1000,
    }) === 7000,
    'Case5 failed: global timeout should resolve'
  )
  assert(
    resolveTimeoutMs({
      env: { GLOBAL_TIMEOUT: '7000', SPECIFIC_TIMEOUT: '9000' },
      globalKey: 'GLOBAL_TIMEOUT',
      specificKey: 'SPECIFIC_TIMEOUT',
      fallbackMs: 1000,
    }) === 9000,
    'Case6 failed: specific timeout should override global'
  )
  assert(
    resolveTimeoutMs({
      env: { GLOBAL_TIMEOUT: '7000', SPECIFIC_TIMEOUT: '0' },
      globalKey: 'GLOBAL_TIMEOUT',
      specificKey: 'SPECIFIC_TIMEOUT',
      fallbackMs: 1000,
    }) === 7000,
    'Case7 failed: invalid specific timeout should fallback to global'
  )
  assert(
    resolveTimeoutMs({
      env: { GLOBAL_TIMEOUT: 'bad' },
      globalKey: 'GLOBAL_TIMEOUT',
      fallbackMs: 4321,
    }) === 4321,
    'Case8 failed: invalid global timeout should fallback to default'
  )

  // enrichTimeoutResult coverage
  const nonTimeout = enrichTimeoutResult({
    label: 'step-a',
    timeoutMs: 1234,
    status: 0,
    error: null,
    stderr: 'base',
  })
  assert(nonTimeout.timedOut === false, 'Case9 failed: non-timeout should not be timedOut')
  assert(nonTimeout.exitCode === 0, 'Case10 failed: exitCode should preserve status')
  assert(nonTimeout.stderr === 'base', 'Case11 failed: stderr should remain unchanged')

  const timeout = enrichTimeoutResult({
    label: 'step-b',
    timeoutMs: 2500,
    status: null,
    error: { name: 'Error', code: 'ETIMEDOUT' },
    stderr: 'base-timeout',
  })
  assert(timeout.timedOut === true, 'Case12 failed: timeout should set timedOut=true')
  assert(timeout.exitCode === 1, 'Case13 failed: null status should default exitCode=1')
  assert(
    timeout.stderr.includes('Step "step-b" timed out after 2500ms.'),
    'Case14 failed: timeout suffix missing from stderr'
  )

  console.log(
    JSON.stringify(
      {
        ok: true,
        check: 'marketing-release-timeout-helpers',
        cases: [
          'parse timeout valid/invalid behavior',
          'resolve timeout global/specific precedence',
          'enrich timeout timedOut + stderr suffix behavior',
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
        check: 'marketing-release-timeout-helpers',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  )
  process.exit(1)
}

