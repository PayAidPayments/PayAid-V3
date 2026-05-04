/**
 * M0 event taxonomy + outbox closure Jest orchestrator.
 * Set EVENT_TAXONOMY_CLOSURE_DETECT_OPEN_HANDLES=0 (or false) to omit Jest --detectOpenHandles for faster local runs; default keeps it on for CI-style runs.
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const timeoutMs = Number(process.env.EVENT_TAXONOMY_CLOSURE_TIMEOUT_MS || 180000)
const perSuiteTimeoutMs = Number(process.env.EVENT_TAXONOMY_CLOSURE_TIMEOUT_PER_SUITE_MS || timeoutMs)
const mode = process.env.EVENT_TAXONOMY_CLOSURE_MODE || 'split'
const detectOpenHandles =
  process.env.EVENT_TAXONOMY_CLOSURE_DETECT_OPEN_HANDLES !== '0' &&
  process.env.EVENT_TAXONOMY_CLOSURE_DETECT_OPEN_HANDLES !== 'false'
const tests = [
  '__tests__/m0/m0-event-taxonomy-contract.test.ts',
  '__tests__/m0/m0-non-leads-queue-contracts.test.ts',
  '__tests__/m0/m0-shared-business-graph-contract.test.ts',
  '__tests__/m0/m0-outbox.test.ts',
  '__tests__/m0/m0-outbox-dispatcher.test.ts',
  '__tests__/m0/m0-outbox-health.test.ts',
  '__tests__/m0/m0-outbox-reconciliation-routes.test.ts',
]
const taxonomyContractSuite = tests[0]
const nonTaxonomySuites = tests.slice(1)

function getJestArgs(runTests) {
  return [
    'node_modules/jest/bin/jest.js',
    '--config',
    'jest.m0.config.js',
    '--runInBand',
    '--runTestsByPath',
    ...runTests,
    '--forceExit',
    ...(detectOpenHandles ? ['--detectOpenHandles'] : []),
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

let runs = []
if (mode === 'single' || mode === 'batch') {
  runs = [await runJest(tests, timeoutMs)]
} else if (mode === 'hybrid') {
  // Known runner quirk: taxonomy suite is more reliable in an isolated run.
  runs.push(await runJest([taxonomyContractSuite], timeoutMs))
  for (const testFile of nonTaxonomySuites) {
    runs.push(await runJest([testFile], perSuiteTimeoutMs))
  }
} else {
  for (const testFile of tests) {
    const run = await runJest([testFile], perSuiteTimeoutMs)
    runs.push(run)
  }
}

const finishedAt = new Date()
const elapsedMs = finishedAt.getTime() - startedAt.getTime()
const pass = runs.every((r) => r.pass)

const artifactDir = path.join(repoRoot, 'docs', 'evidence', 'closure')
await mkdir(artifactDir, { recursive: true })

const stamp = finishedAt.toISOString().replace(/[:.]/g, '-')
const artifactPath = path.join(artifactDir, `${stamp}-event-taxonomy-closure-check.md`)

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

const content = `# Event Taxonomy Closure Check

- Started: ${startedAt.toISOString()}
- Finished: ${finishedAt.toISOString()}
- Mode: ${mode}
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
      mode,
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
