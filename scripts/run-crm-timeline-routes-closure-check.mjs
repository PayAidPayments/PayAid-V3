import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const timeoutMs = Number(process.env.CRM_TIMELINE_CLOSURE_TIMEOUT_MS || 180000)
const perSuiteTimeoutMs = Number(process.env.CRM_TIMELINE_CLOSURE_TIMEOUT_PER_SUITE_MS || timeoutMs)

const tests = [
  '__tests__/m0/m0-account-timeline-route.test.ts',
  '__tests__/m0/m0-contact-timeline-route.test.ts',
  '__tests__/m0/m0-deal-timeline-route.test.ts',
]

function getJestArgs(runTests) {
  return [
    'node_modules/jest/bin/jest.js',
    '--config',
    'jest.m0.config.js',
    '--runInBand',
    '--runTestsByPath',
    ...runTests,
    '--forceExit',
    '--detectOpenHandles',
  ]
}

const startedAt = new Date()

function runJest(runTests, runTimeoutMs) {
  return new Promise((resolve) => {
    let timedOut = false
    let stdout = ''
    let stderr = ''
    const jestArgs = getJestArgs(runTests)
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
        tests: runTests,
        command: `node ${jestArgs.join(' ')}`,
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

const runs = []
for (const testFile of tests) {
  runs.push(await runJest([testFile], perSuiteTimeoutMs))
}

const finishedAt = new Date()
const elapsedMs = finishedAt.getTime() - startedAt.getTime()
const pass = runs.every((r) => r.pass)

const artifactDir = path.join(repoRoot, 'docs', 'evidence', 'closure')
await mkdir(artifactDir, { recursive: true })

const stamp = finishedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(artifactDir, `${stamp}-crm-timeline-routes-closure-check.md`)

const runSections = runs
  .map(
    (run, idx) => `### Run ${idx + 1}

- Tests: ${run.tests.join(', ')}
- Timed out: ${run.timedOut}
- Exit code: ${run.exitCode ?? 'null'}
- Exit signal: ${run.exitSignal ?? 'null'}
- Elapsed ms: ${run.elapsedMs}
- Pass: ${run.pass}

\`\`\`
${run.command}
\`\`\`

#### Stdout (tail)
\`\`\`
${run.stdout.slice(-2000)}
\`\`\`

#### Stderr (tail)
\`\`\`
${run.stderr.slice(-2000)}
\`\`\`
`
  )
  .join('\n')

const content = `# CRM Timeline Routes Closure Check

- Started: ${startedAt.toISOString()}
- Finished: ${finishedAt.toISOString()}
- Timeout ms: ${timeoutMs}
- Per-suite timeout ms: ${perSuiteTimeoutMs}
- Pass: ${pass}
- Runs: ${runs.length}

## Run Details

${runSections}
`

await writeFile(artifactPath, content, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: pass,
      timeout_ms: timeoutMs,
      per_suite_timeout_ms: perSuiteTimeoutMs,
      runs: runs.map((run) => ({
        tests: run.tests,
        pass: run.pass,
        timed_out: run.timedOut,
        exit_code: run.exitCode,
        elapsed_ms: run.elapsedMs,
      })),
      elapsed_ms: elapsedMs,
      artifact_path: path.relative(repoRoot, artifactPath).replaceAll('\\', '/'),
    },
    null,
    2
  )
)

if (!pass) {
  process.exit(1)
}
