import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const steps = [
  {
    id: 'closeout-status-snapshot',
    command: ['npm', 'run', 'run:canonical-closeout-status-snapshot'],
    timeoutMs: Number(process.env.CANONICAL_STATUS_REFRESH_TIMEOUT_SNAPSHOT_MS || '420000'),
    acceptableExitCodes: [0, 1],
  },
  {
    id: 'live-status-sync',
    command: ['npm', 'run', 'sync:canonical-live-status'],
    timeoutMs: Number(process.env.CANONICAL_STATUS_REFRESH_TIMEOUT_SYNC_MS || '120000'),
    acceptableExitCodes: [0],
  },
  {
    id: 'closeout-next-actions',
    command: ['npm', 'run', 'show:canonical-closeout-next-actions'],
    timeoutMs: Number(process.env.CANONICAL_STATUS_REFRESH_TIMEOUT_NEXT_ACTIONS_MS || '120000'),
    acceptableExitCodes: [0, 1],
  },
]

function runStep(step) {
  const started = Date.now()
  const [cmd, ...args] = step.command
  const run = spawnSync(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: step.timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  })
  const elapsedMs = Date.now() - started
  const timedOut = run.error?.code === 'ETIMEDOUT'
  const exitCode = typeof run.status === 'number' ? run.status : 1
  const expectedExit = (step.acceptableExitCodes || [0]).includes(exitCode)
  return {
    id: step.id,
    command: [cmd, ...args].join(' '),
    timeoutMs: step.timeoutMs,
    elapsedMs,
    exitCode,
    timedOut,
    expectedExit,
    ok: expectedExit && !timedOut,
    outputTail: `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').slice(-80),
  }
}

const results = []
for (const step of steps) {
  const result = runStep(step)
  results.push(result)
}

const overallOk = results.length === steps.length && results.every((result) => result.ok)

const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-status-refresh.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-status-refresh.md`)

const payload = {
  check: 'canonical-status-refresh',
  timestamp: isoNow,
  overallOk,
  totalSteps: steps.length,
  completedSteps: results.length,
  results,
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical status refresh')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Overall: ${overallOk ? 'pass' : 'fail'}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Step results')
lines.push('')
for (const result of results) {
  lines.push(
    `- ${result.ok ? 'PASS' : 'FAIL'} ${result.id} (\`${result.command}\`, ${result.elapsedMs}ms, timeout=${result.timeoutMs}ms${result.timedOut ? ', timed out' : ''})`
  )
}
lines.push('')
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(payload, null, 2))
lines.push('```')
lines.push('')

writeFileSync(mdPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ overallOk, jsonPath, mdPath }, null, 2))
process.exitCode = overallOk ? 0 : 1
