#!/usr/bin/env node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

function writeFixturePackageJson(baseDir, scripts) {
  const fixturePath = join(baseDir, 'package.json')
  const fixture = {
    name: 'leads-policy-mirror-fixture',
    private: true,
    scripts,
  }
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8')
  return fixturePath
}

function runVerifier(packageJsonPath) {
  const run = spawnSync(process.execPath, ['scripts/verify-leads-bulk-retention-policy-mirror.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      LEADS_BULK_RETENTION_POLICY_MIRROR_PACKAGE_JSON_PATH: packageJsonPath,
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
    parsed,
  }
}

const fullPipeline =
  'cross-env LEADS_BULK_RETENTION_INCLUDE_HELPERS_EVIDENCE=1 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS=180000 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_HELPERS_EVIDENCE=180000 node scripts/noop.mjs'
const fullPreflight =
  'cross-env LEADS_BULK_RETENTION_INCLUDE_HELPERS_EVIDENCE=1 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_PREFLIGHT=180000 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_GATE_PIPELINE=180000 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_HELPERS_EVIDENCE=180000 node scripts/noop.mjs'
const fullPreflightEvidence =
  'cross-env LEADS_BULK_RETENTION_INCLUDE_HELPERS_EVIDENCE=1 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_PREFLIGHT_EVIDENCE=180000 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_PREFLIGHT=180000 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_GATE_PIPELINE=180000 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_HELPERS_EVIDENCE=180000 node scripts/noop.mjs'
const driftPipeline =
  'cross-env LEADS_BULK_RETENTION_INCLUDE_HELPERS_EVIDENCE=1 LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_HELPERS_EVIDENCE=180000 node scripts/noop.mjs'

const tempRoot = mkdtempSync(join(tmpdir(), 'leads-policy-mirror-test-'))
try {
  const passingPath = writeFixturePackageJson(tempRoot, {
    'run:leads-bulk-retention-health-gate-pipeline:with-helpers:timeout-guard': fullPipeline,
    'run:leads-bulk-retention-health-gate:preflight:with-helpers:timeout-guard': fullPreflight,
    'run:leads-bulk-retention-health-gate:preflight:evidence:with-helpers:timeout-guard':
      fullPreflightEvidence,
  })
  const driftDir = join(tempRoot, 'drift')
  mkdirSync(driftDir, { recursive: true })
  const failingPath = writeFixturePackageJson(driftDir, {
    'run:leads-bulk-retention-health-gate-pipeline:with-helpers:timeout-guard': driftPipeline,
    'run:leads-bulk-retention-health-gate:preflight:with-helpers:timeout-guard': fullPreflight,
    'run:leads-bulk-retention-health-gate:preflight:evidence:with-helpers:timeout-guard':
      fullPreflightEvidence,
  })

  const passRun = runVerifier(passingPath)
  const failRun = runVerifier(failingPath)

  const passCaseOk = passRun.ok && passRun.parsed?.ok === true
  const failCaseOk =
    !failRun.ok &&
    failRun.parsed?.ok === false &&
    Array.isArray(failRun.parsed?.pipelineScript?.missingTokens) &&
    failRun.parsed.pipelineScript.missingTokens.length > 0

  const ok = passCaseOk && failCaseOk
  console.log(
    JSON.stringify(
      {
        check: 'leads-bulk-retention-policy-mirror-regression',
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
