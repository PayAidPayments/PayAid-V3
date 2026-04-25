#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const profile = (process.env.MARKETING_RELEASE_GATE_PROFILE || 'baseline').toLowerCase()

const profileEnv = {
  baseline: {
    MARKETING_RELEASE_INCLUDE_MARKER_HELPERS: '0',
    MARKETING_RELEASE_MARKER_HELPERS_WARNING_ONLY: '0',
    MARKETING_RELEASE_INCLUDE_MARKER_VERIFIER: '0',
    MARKETING_RELEASE_MARKER_VERIFIER_WARNING_ONLY: '0',
  },
  hardened: {
    MARKETING_RELEASE_INCLUDE_MARKER_HELPERS: '1',
    MARKETING_RELEASE_MARKER_HELPERS_WARNING_ONLY: '0',
    MARKETING_RELEASE_INCLUDE_MARKER_VERIFIER: '1',
    MARKETING_RELEASE_MARKER_VERIFIER_WARNING_ONLY: '0',
  },
  audit: {
    MARKETING_RELEASE_INCLUDE_MARKER_HELPERS: '1',
    MARKETING_RELEASE_MARKER_HELPERS_WARNING_ONLY: '1',
    MARKETING_RELEASE_INCLUDE_MARKER_VERIFIER: '1',
    MARKETING_RELEASE_MARKER_VERIFIER_WARNING_ONLY: '1',
  },
}

if (!profileEnv[profile]) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Unknown MARKETING_RELEASE_GATE_PROFILE',
        profile,
        allowed: Object.keys(profileEnv),
      },
      null,
      2
    )
  )
  process.exit(1)
}

const env = {
  ...process.env,
  ...profileEnv[profile],
}

const run = spawnSync(process.execPath, ['scripts/run-marketing-release-gate-pipeline.mjs'], {
  env,
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

console.log(
  JSON.stringify(
    {
      ok: run.status === 0,
      profile,
      profileEnv: profileEnv[profile],
      pipeline: parsed,
      rawStdout: parsed ? undefined : stdout || null,
      rawStderr: stderr || null,
    },
    null,
    2
  )
)

process.exit(run.status ?? 1)

