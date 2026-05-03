import { spawnSync } from 'node:child_process'

const STEPS = [
  ['helper-contract-gate', ['run', 'test:website-builder-step4-8-helper-contract-gate']],
  ['flag-parser-gate', ['run', 'test:website-builder-step4-8-flag-parser-gate']],
  ['gates', ['run', 'test:website-builder-step4-8-gates']],
  ['docs-gate', ['run', 'test:website-builder-step4-8-docs-gate']],
  ['helper-gate', ['run', 'test:website-builder-step4-8-helper-gate']],
  ['next-action', ['run', 'test:website-builder-step4-8-next-action']],
  ['token-probe', ['run', 'test:website-builder-step4-8-token-probe']],
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
    stdout: run.stdout || '',
    stderr: run.stderr || '',
  }
}

const results = STEPS.map(([label, args]) => runStep(label, args))
const overallOk = results.every((r) => r.ok)

console.log(
  JSON.stringify(
    {
      check: 'website-builder-step4-8-helper-tests',
      overallOk,
      steps: results.map((r) => ({
        label: r.label,
        command: r.command,
        ok: r.ok,
        exitCode: r.exitCode,
        elapsedMs: r.elapsedMs,
      })),
      note: overallOk
        ? 'All Step 4.8 helper tests passed.'
        : 'One or more Step 4.8 helper tests failed.',
    },
    null,
    2
  )
)

process.exitCode = overallOk ? 0 : 1
