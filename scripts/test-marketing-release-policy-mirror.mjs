#!/usr/bin/env node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

function writeFixturePackageJson(baseDir, scripts) {
  const fixturePath = join(baseDir, 'package.json')
  const fixture = {
    name: 'policy-mirror-fixture',
    private: true,
    scripts,
  }
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8')
  return fixturePath
}

function runVerifier(packageJsonPath) {
  const run = spawnSync(process.execPath, ['scripts/verify-marketing-release-policy-mirror.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      MARKETING_RELEASE_POLICY_MIRROR_PACKAGE_JSON_PATH: packageJsonPath,
    },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  const stdout = (run.stdout || '').trim()
  let parsed = null
  try {
    parsed = JSON.parse(stdout)
  } catch {
    parsed = null
  }
  return {
    ok: run.status === 0,
    exitCode: run.status ?? 1,
    parsed,
    stdout,
    stderr: (run.stderr || '').trim(),
  }
}

const fullScript =
  'cross-env MARKETING_RELEASE_PRODUCTION_VERIFICATION_WARNING_ONLY=1 MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS=180000 MARKETING_RELEASE_EVIDENCE_HELPERS_SUITE_STEP_TIMEOUT_MS=180000 MARKETING_RELEASE_INCLUDE_EVIDENCE_HELPERS=1 MARKETING_RELEASE_INCLUDE_EVIDENCE_LATENCY_GATE=1 MARKETING_RELEASE_EVIDENCE_HELPERS_WARNING_ONLY=1 MARKETING_RELEASE_EVIDENCE_LATENCY_GATE_WARNING_ONLY=1 node scripts/noop.mjs'
const driftScript =
  'cross-env MARKETING_RELEASE_PRODUCTION_VERIFICATION_WARNING_ONLY=1 MARKETING_RELEASE_GATE_EVIDENCE_BUNDLE_STEP_TIMEOUT_MS=180000 node scripts/noop.mjs'

const tempRoot = mkdtempSync(join(tmpdir(), 'policy-mirror-test-'))
try {
  const passingPath = writeFixturePackageJson(tempRoot, {
    'run:marketing-release-production-rollout-verification:warn:timeout-guard': fullScript,
    'show:marketing-release-operator-policy:rollout-warn-timeout-guard': fullScript,
  })
  const driftDir = join(tempRoot, 'drift')
  mkdirSync(driftDir, { recursive: true })
  const failingPath = writeFixturePackageJson(driftDir, {
    'run:marketing-release-production-rollout-verification:warn:timeout-guard': driftScript,
    'show:marketing-release-operator-policy:rollout-warn-timeout-guard': fullScript,
  })

  const passRun = runVerifier(passingPath)
  const failRun = runVerifier(failingPath)

  const passCaseOk = passRun.ok && passRun.parsed?.ok === true
  const failCaseOk =
    !failRun.ok &&
    failRun.parsed?.ok === false &&
    Array.isArray(failRun.parsed?.rolloutScript?.missingTokens) &&
    failRun.parsed.rolloutScript.missingTokens.length > 0

  const ok = passCaseOk && failCaseOk
  console.log(
    JSON.stringify(
      {
        check: 'marketing-release-policy-mirror-regression',
        ok,
        cases: {
          passCaseOk,
          failCaseOk,
        },
      },
      null,
      2,
    ),
  )
  process.exit(ok ? 0 : 1)
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}

