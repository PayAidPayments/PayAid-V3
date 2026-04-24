import { spawnSync } from 'node:child_process'

const STEPS = [
  ['evidence-pipeline', ['run', 'run:website-builder-step4-8-evidence-pipeline']],
  ['ready-to-commit-preflight', ['run', 'check:website-builder-ready-to-commit']],
]

function runStep(label, args) {
  const started = Date.now()
  const run = spawnSync('npm', args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  const elapsedMs = Date.now() - started
  const exitCode = typeof run.status === 'number' ? run.status : 1
  return {
    label,
    command: `npm ${args.join(' ')}`,
    ok: exitCode === 0,
    exitCode,
    elapsedMs,
  }
}

const results = []
for (const [label, args] of STEPS) {
  const result = runStep(label, args)
  results.push(result)
  if (!result.ok) break
}

const overallOk = results.length === STEPS.length && results.every((result) => result.ok)

console.log(
  JSON.stringify(
    {
      check: 'website-builder-ready-to-commit-pack',
      overallOk,
      steps: results,
      note: overallOk
        ? 'Website Builder evidence pipeline and commit preflight passed.'
        : 'One or more steps failed. Review step outputs and generated artifacts.',
    },
    null,
    2
  )
)

process.exitCode = overallOk ? 0 : 1
