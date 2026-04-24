import { spawnSync } from 'node:child_process'

const CHECK_CMD = ['run', 'check:website-builder-step4-8-runtime']
const APPLY_CMD = ['run', 'apply:website-builder-step4-8-runtime-artifact']

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
    exitCode,
    ok: exitCode === 0,
    elapsedMs,
    stdout: run.stdout || '',
    stderr: run.stderr || '',
  }
}

const check = runStep('check', CHECK_CMD)
const apply = runStep('apply', APPLY_CMD)

const overallOk = check.ok && apply.ok
const summary = {
  overallOk,
  steps: [
    {
      label: check.label,
      command: check.command,
      ok: check.ok,
      exitCode: check.exitCode,
      elapsedMs: check.elapsedMs,
    },
    {
      label: apply.label,
      command: apply.command,
      ok: apply.ok,
      exitCode: apply.exitCode,
      elapsedMs: apply.elapsedMs,
    },
  ],
  note: overallOk
    ? 'Website Builder Step 4.8 runtime checks passed and evidence template was auto-updated.'
    : 'One or more steps failed. Evidence template may still contain useful blocked/fail details.',
}

console.log(JSON.stringify(summary, null, 2))
process.exitCode = overallOk ? 0 : 1
