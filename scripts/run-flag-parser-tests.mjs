import { spawnSync } from 'node:child_process'

const STEPS = [
  ['strict-flag-esm', ['run', 'test:strict-flag']],
  ['strict-flag-cjs', ['run', 'test:strict-flag:cjs']],
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
const overallOk = results.every((result) => result.ok)

console.log(
  JSON.stringify(
    {
      check: 'flag-parser-tests',
      overallOk,
      steps: results.map((result) => ({
        label: result.label,
        command: result.command,
        ok: result.ok,
        exitCode: result.exitCode,
        elapsedMs: result.elapsedMs,
      })),
      note: overallOk ? 'All flag parser tests passed.' : 'One or more flag parser tests failed.',
    },
    null,
    2
  )
)

process.exitCode = overallOk ? 0 : 1
