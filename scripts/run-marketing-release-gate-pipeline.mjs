#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function runStep(label, command, args, env = process.env) {
  const startedAt = Date.now()
  const result = spawnSync(command, args, {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  return {
    label,
    command: [command, ...args].join(' '),
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    elapsedMs: Date.now() - startedAt,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  }
}

const env = { ...process.env, MARKETING_RELEASE_CLOSURE_STRICT: '1' }

const steps = [
  runStep('social-smoke-evidence', process.execPath, ['scripts/run-social-oauth-smoke-evidence.mjs'], env),
  runStep(
    'social-smoke-handoff-snippet',
    process.execPath,
    ['scripts/generate-social-oauth-smoke-handoff-snippet.mjs'],
    env
  ),
  runStep(
    'marketing-closure-pack-strict',
    process.execPath,
    ['scripts/run-marketing-release-closure-pack.mjs'],
    env
  ),
]

const overallOk = steps.every((s) => s.ok)
const output = {
  check: 'marketing-release-gate-pipeline',
  overallOk,
  steps: steps.map((s) => ({
    label: s.label,
    ok: s.ok,
    exitCode: s.exitCode,
    elapsedMs: s.elapsedMs,
    command: s.command,
  })),
}

console.log(JSON.stringify(output, null, 2))

if (!overallOk) {
  const failed = steps.find((s) => !s.ok)
  if (failed) {
    if (failed.stdout) {
      console.error('\n# Failed step stdout')
      console.error(failed.stdout)
    }
    if (failed.stderr) {
      console.error('\n# Failed step stderr')
      console.error(failed.stderr)
    }
  }
}

process.exit(overallOk ? 0 : 1)

