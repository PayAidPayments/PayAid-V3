#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const profiles = ['baseline', 'hardened', 'audit']

function runProfile(profile) {
  const startedAt = Date.now()
  const run = spawnSync(process.execPath, ['scripts/run-marketing-release-gate-profile.mjs'], {
    env: { ...process.env, MARKETING_RELEASE_GATE_PROFILE: profile },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  const stdout = (run.stdout || '').trim()
  const stderr = (run.stderr || '').trim()
  let parsed = null
  try {
    parsed = stdout ? JSON.parse(stdout) : null
  } catch {
    parsed = null
  }
  return {
    profile,
    ok: run.status === 0,
    exitCode: run.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    parsed,
    stdout: parsed ? null : stdout || null,
    stderr: stderr || null,
  }
}

const results = profiles.map((profile) => runProfile(profile))
const overallOk = results.every((r) => r.ok)

console.log(
  JSON.stringify(
    {
      check: 'marketing-release-gate-profile-matrix',
      overallOk,
      profiles,
      results: results.map((r) => ({
        profile: r.profile,
        ok: r.ok,
        exitCode: r.exitCode,
        elapsedMs: r.elapsedMs,
        pipelineOverallOk: r.parsed?.pipeline?.overallOk ?? null,
        includeMarkerHelpers: r.parsed?.pipeline?.includeMarkerHelpers ?? null,
        includeMarkerVerifier: r.parsed?.pipeline?.includeMarkerVerifier ?? null,
        markerHelpersWarningOnly: r.parsed?.pipeline?.markerHelpersWarningOnly ?? null,
        markerVerifierWarningOnly: r.parsed?.pipeline?.markerVerifierWarningOnly ?? null,
      })),
    },
    null,
    2
  )
)

if (!overallOk) {
  const failed = results.find((r) => !r.ok)
  if (failed) {
    if (failed.stdout) {
      console.error('\n# Failed profile raw stdout')
      console.error(failed.stdout)
    }
    if (failed.stderr) {
      console.error('\n# Failed profile stderr')
      console.error(failed.stderr)
    }
  }
}

process.exit(overallOk ? 0 : 1)

