/**
 * Runs prisma generate through the existing retry wrapper with a hard timeout.
 * Emits a markdown artifact for deterministic triage on hosts where generate can hang.
 *
 * Env:
 * - PRISMA_GENERATE_CLOSURE_TIMEOUT_MS (default 120000)
 * - PRISMA_GENERATE_STRICT (forwarded to underlying wrapper; default "1")
 * - PRISMA_GENERATE_MAX_ATTEMPTS (optional; forwarded)
 * - PRISMA_GENERATE_RETRY_MS (optional; forwarded)
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const runTimeoutMs = Number(process.env.PRISMA_GENERATE_CLOSURE_TIMEOUT_MS || 120000)
const scriptPath = path.join('scripts', 'prisma-generate-with-retry.js')
const cmdArgs = ['node', scriptPath]
const startedAt = new Date()

function runGenerateWithTimeout() {
  return new Promise((resolve) => {
    let timedOut = false
    let stdout = ''
    let stderr = ''

    const env = {
      ...process.env,
      PRISMA_GENERATE_STRICT: process.env.PRISMA_GENERATE_STRICT || '1',
    }

    const child = spawn(cmdArgs[0], cmdArgs.slice(1), {
      cwd: repoRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

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
    }, runTimeoutMs)

    child.on('exit', (code, signal) => {
      clearTimeout(timer)
      resolve({
        timedOut,
        exitCode: code,
        exitSignal: signal,
        elapsedMs: Date.now() - startedMs,
        stdout,
        stderr,
        pass: !timedOut && code === 0,
      })
    })
  })
}

const run = await runGenerateWithTimeout()
const finishedAt = new Date()
const artifactDir = path.join(repoRoot, 'docs', 'evidence', 'closure')
await mkdir(artifactDir, { recursive: true })
const stamp = finishedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(artifactDir, `${stamp}-prisma-generate-closure-check.md`)

const content = `# Prisma generate closure check

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
${cmdArgs.join(' ')}
\`\`\`

## Stdout (tail)

\`\`\`
${run.stdout.slice(-6000)}
\`\`\`

## Stderr (tail)

\`\`\`
${run.stderr.slice(-6000)}
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
      elapsed_ms: run.elapsedMs,
      artifact_path: path.relative(repoRoot, artifactPath).replaceAll('\\', '/'),
    },
    null,
    2
  )
)

if (!run.pass) process.exit(1)
