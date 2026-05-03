import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const stepTimeoutMs = Number(process.env.RELEASE_GATE_WARN_ONLY_BUNDLE_STEP_TIMEOUT_MS || 180000)
const openArtifacts = process.argv.includes('--open')
const skipReleaseGate = process.argv.includes('--skip-release-gate')
const startedAt = new Date()

const steps = [
  { id: 'checklist', command: ['npm', 'run', 'show:release-gate-warn-only-next-actions:markdown:write'] },
  {
    id: 'pointer_summary',
    command: ['npm', 'run', 'run:release-gate-warn-only-pointer-summary:allow-missing-checklist'],
  },
  { id: 'artifact_pack', command: ['npm', 'run', 'show:release-gate-warn-only:artifact-pack'] },
]

if (!skipReleaseGate) {
  steps.unshift({ id: 'release_gate', command: ['npm', 'run', 'release:gate:timeline-contracts'] })
}

if (openArtifacts) {
  steps.push({ id: 'artifact_pack_open', command: ['npm', 'run', 'open:release-gate-warn-only:artifact-pack'] })
}

function runStep(step) {
  return new Promise((resolve) => {
    const [cmd, ...args] = step.command
    const spawnCmd =
      process.platform === 'win32'
        ? 'cmd'
        : cmd
    const spawnArgs =
      process.platform === 'win32'
        ? ['/c', cmd, ...args]
        : args

    const child = spawn(spawnCmd, spawnArgs, {
      cwd: repoRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let timedOut = false
    let stdout = ''
    let stderr = ''
    const startedMs = Date.now()

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    const timer = setTimeout(() => {
      timedOut = true
      if (process.platform === 'win32') {
        spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
          cwd: repoRoot,
          stdio: 'ignore',
          windowsHide: true,
        })
      } else {
        child.kill('SIGTERM')
        setTimeout(() => child.kill('SIGKILL'), 2000)
      }
    }, stepTimeoutMs)

    child.on('exit', (code, signal) => {
      clearTimeout(timer)
      resolve({
        step: step.id,
        command: step.command.join(' '),
        timed_out: timedOut,
        exit_code: code,
        exit_signal: signal,
        elapsed_ms: Date.now() - startedMs,
        ok: !timedOut && code === 0,
        stdout_tail: stdout.slice(-5000),
        stderr_tail: stderr.slice(-5000),
      })
    })
  })
}

const results = []
for (const step of steps) {
  // Always continue so operators still get downstream artifact evidence.
  // Final status reflects whether all steps passed.
  // This keeps local triage deterministic on flaky hosts.
  // eslint-disable-next-line no-await-in-loop
  const result = await runStep(step)
  results.push(result)
}

const finishedAt = new Date()
const allPass = results.every((r) => r.ok)
const artifactDir = path.join(repoRoot, 'docs', 'evidence', 'closure')
await mkdir(artifactDir, { recursive: true })
const stamp = finishedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(artifactDir, `${stamp}-release-gate-warn-only-artifact-pack-bundle.md`)

const lines = []
lines.push('# Release-gate warn-only artifact-pack bundle')
lines.push('')
lines.push(`- Started: ${startedAt.toISOString()}`)
lines.push(`- Finished: ${finishedAt.toISOString()}`)
lines.push(`- Step timeout ms: ${stepTimeoutMs}`)
lines.push(`- Open artifacts: ${openArtifacts}`)
lines.push(`- Skip release gate: ${skipReleaseGate}`)
lines.push(`- all_pass: ${allPass}`)
lines.push('')
for (const r of results) {
  lines.push(`## ${r.step}`)
  lines.push(`- ok: ${r.ok}`)
  lines.push(`- timed_out: ${r.timed_out}`)
  lines.push(`- exit_code: ${r.exit_code ?? 'null'}`)
  lines.push(`- exit_signal: ${r.exit_signal ?? 'null'}`)
  lines.push(`- elapsed_ms: ${r.elapsed_ms}`)
  lines.push('- command:')
  lines.push('```')
  lines.push(r.command)
  lines.push('```')
  lines.push('- stdout (tail):')
  lines.push('```')
  lines.push(r.stdout_tail)
  lines.push('```')
  lines.push('- stderr (tail):')
  lines.push('```')
  lines.push(r.stderr_tail)
  lines.push('```')
  lines.push('')
}

await writeFile(artifactPath, `${lines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: allPass,
      step_timeout_ms: stepTimeoutMs,
      open_artifacts: openArtifacts,
      skip_release_gate: skipReleaseGate,
      steps: results.map((r) => ({
        step: r.step,
        ok: r.ok,
        timed_out: r.timed_out,
        exit_code: r.exit_code,
        elapsed_ms: r.elapsed_ms,
      })),
      artifact_path: path.relative(repoRoot, artifactPath).replaceAll('\\', '/'),
    },
    null,
    2
  )
)

if (!allPass) process.exit(1)
