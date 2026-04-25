#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const strict = process.env.MARKER_DOCTOR_FIX_STRICT === '1'
const autoTtlMinutes = Number(process.env.MARKER_DOCTOR_FIX_TTL_MINUTES || 15)

function runNode(args, env = process.env) {
  return spawnSync(process.execPath, args, {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

function parseJson(stdout) {
  try {
    return JSON.parse((stdout || '').trim())
  } catch {
    return null
  }
}

const beforeRun = runNode(['scripts/run-marker-mutation-doctor.mjs'])
const before = parseJson(beforeRun.stdout)
if (!before || beforeRun.status !== 0) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Failed to read initial marker doctor status',
        stdout: beforeRun.stdout || null,
        stderr: beforeRun.stderr || null,
      },
      null,
      2
    )
  )
  process.exit(1)
}

let action = 'none'
let actionResult = null
if (!strict && before?.diagnosis?.state !== 'approval_active') {
  action = 'create_short_lived_approval'
  const create = runNode(['scripts/set-marker-mutation-approval.mjs'], {
    ...process.env,
    MARKER_MUTATION_APPROVAL_TTL_MINUTES: String(autoTtlMinutes),
  })
  actionResult = {
    ok: create.status === 0,
    exitCode: create.status ?? 1,
    stdout: (create.stdout || '').trim() || null,
    stderr: (create.stderr || '').trim() || null,
  }
}

const afterRun = runNode(['scripts/run-marker-mutation-doctor.mjs'])
const after = parseJson(afterRun.stdout)
if (!after || afterRun.status !== 0) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Failed to read final marker doctor status',
        stdout: afterRun.stdout || null,
        stderr: afterRun.stderr || null,
        before,
        action,
        actionResult,
      },
      null,
      2
    )
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      strict,
      autoTtlMinutes,
      before,
      action,
      actionResult,
      after,
      nextSteps: [
        'If you only needed temporary approval, clear it after use: npm run markers:disallow-mutation',
      ],
    },
    null,
    2
  )
)

