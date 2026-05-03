/**
 * Runs workflow automation M0 tests one file at a time with hard per-suite timeouts
 * and Windows process-tree termination on timeout (same pattern as event taxonomy closure).
 *
 * Jest scope: this script calls Jest with `--runTestsByPath` for the explicit `tests` list
 * only. `jest.m0.config.js` roots all of `__tests__/m0`, but that does not auto-include files
 * here; anything that must run under release gate `workflow-automation-contracts` (for example
 * when invoked from `npm run release:gate:timeline-contracts`) must be appended to
 * `WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS` (then `tests` stays a spread copy) and kept aligned
 * with workflow `paths:` filters and related contract tests.
 *
 * Env:
 * - WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_MS — overall budget per run (default 180000)
 * - WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS — per file (defaults to same as overall)
 */

// Jest pins: __tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts — describe 'timeline release-gate workflow contracts', nested describe 'workflow-automation closure runner source'.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const timeoutMs = Number(process.env.WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_MS || 180000)
const perSuiteTimeoutMs = Number(
  process.env.WORKFLOW_AUTOMATION_CLOSURE_TIMEOUT_PER_SUITE_MS || timeoutMs
)

// Phase 311: literal must equal TIMELINE_CONTRACT_SUITE_RELPATH (__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts).

// Jest `--runTestsByPath` string for the timeline workflow contract suite (Phase 291); keep in sync with suite file @see.
const M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST =
  '__tests__/m0/m0-timeline-release-gate-workflow-contracts.test.ts'

// Canonical ordered list for this gate; guards below derive from this array (Phase 288).
const WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS = [
  '__tests__/m0/m0-workflow-engine-approval-gating.test.ts',
  '__tests__/m0/m0-workflow-approval-decisions.test.ts',
  '__tests__/m0/m0-workflow-approval-decision-route.test.ts',
  '__tests__/m0/m0-workflow-approvals-list-route.test.ts',
  // Timeline release-gate workflow contracts: see suite maintenance JSDoc in that file (Phases 289–291); entry must use `M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST`.
  M0_TIMELINE_RELEASE_GATE_WORKFLOW_CONTRACTS_TEST,
]

const tests = [...WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS]

for (const p of WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS) {
  if (!tests.includes(p)) {
    throw new Error(`[workflow-automation-closure] tests[] must include ${p}`)
  }
}
if (tests.length !== WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS.length) {
  throw new Error(
    `[workflow-automation-closure] tests[] length ${tests.length} must equal required list length ${WORKFLOW_AUTOMATION_CLOSURE_TEST_PATHS.length} (no extra entries).`
  )
}
if (new Set(tests).size !== tests.length) {
  throw new Error('[workflow-automation-closure] tests[] must not contain duplicate paths.')
}

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
const artifactPath = path.join(artifactDir, `${stamp}-workflow-automation-closure-check.md`)

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

const content = `# Workflow Automation Closure Check

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
