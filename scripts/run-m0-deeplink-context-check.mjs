/**
 * Runs a single focused Jest file for marketing campaign deeplink-context route tests.
 * Uses a per-run timeout + Windows process-tree kill (same pattern as CRM timeline closure).
 *
 * Env:
 * - M0_DEEPLINK_CONTEXT_TIMEOUT_MS (default 120000, matches timeline-contracts CI)
 *
 * Note: Some Windows dev hosts reproduce a Jest stall before first suite output; the artifact still
 * records the command and any captured logs. Ubuntu CI typically completes this single-file run.
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const runTimeoutMs = Number(process.env.M0_DEEPLINK_CONTEXT_TIMEOUT_MS || 120000)
const testFile = '__tests__/m0/m0-email-campaign-deeplink-context-route.test.ts'

const jestArgs = [
  'node_modules/jest/bin/jest.js',
  '--config',
  'jest.m0.config.js',
  '--runInBand',
  '--runTestsByPath',
  testFile,
  '--forceExit',
]

const startedAt = new Date()

function runJest() {
  return new Promise((resolve) => {
    let timedOut = false
    let stdout = ''
    let stderr = ''
    const child = spawn('node', jestArgs, {
      cwd: repoRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const runStartedAt = Date.now()

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
    }, runTimeoutMs)

    child.on('exit', (code, signal) => {
      clearTimeout(timer)
      const elapsedMs = Date.now() - runStartedAt
      resolve({
        timedOut,
        exitCode: code,
        exitSignal: signal,
        elapsedMs,
        stdout,
        stderr,
        pass: !timedOut && code === 0,
      })
    })
  })
}

const run = await runJest()
const finishedAt = new Date()
const elapsedMs = finishedAt.getTime() - startedAt.getTime()

const artifactDir = path.join(repoRoot, 'docs', 'evidence', 'closure')
await mkdir(artifactDir, { recursive: true })
const stamp = finishedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(artifactDir, `${stamp}-m0-deeplink-context-check.md`)

const content = `# M0 campaign deeplink-context check

- Started: ${startedAt.toISOString()}
- Finished: ${finishedAt.toISOString()}
- Timeout ms: ${runTimeoutMs}
- Pass: ${run.pass}
- Timed out: ${run.timedOut}
- Exit code: ${run.exitCode ?? 'null'}
- Exit signal: ${run.exitSignal ?? 'null'}
- Elapsed ms: ${run.elapsedMs}

## Command

\`\`\`
node ${jestArgs.join(' ')}
\`\`\`

## Stdout (tail)

\`\`\`
${run.stdout.slice(-4000)}
\`\`\`

## Stderr (tail)

\`\`\`
${run.stderr.slice(-4000)}
\`\`\`
`

await writeFile(artifactPath, content, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: run.pass,
      timeout_ms: runTimeoutMs,
      timed_out: run.timedOut,
      exit_code: run.exitCode,
      elapsed_ms: elapsedMs,
      artifact_path: path.relative(repoRoot, artifactPath).replaceAll('\\', '/'),
    },
    null,
    2
  )
)

if (!run.pass) {
  process.exit(1)
}
