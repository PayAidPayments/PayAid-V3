import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const now = new Date()
const nowMs = now.getTime()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')
const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
const signoffPath = path.join(closureDir, 'CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md')

const checks = [
  {
    id: 'due-monitor-checkpoints',
    command: ['npm', 'run', 'run:canonical-due-monitor-checkpoints'],
    timeoutMs: Number(process.env.CANONICAL_CLOSEOUT_TIMEOUT_DUE_MONITORS_MS || '180000'),
  },
  {
    id: 'monitoring-complete',
    command: ['npm', 'run', 'check:canonical-monitoring-complete'],
    timeoutMs: Number(process.env.CANONICAL_CLOSEOUT_TIMEOUT_MONITOR_COMPLETE_MS || '120000'),
  },
  {
    id: 'readiness-verdict-stable',
    command: ['npm', 'run', 'check:canonical-module-api-readiness-verdict:stable'],
    timeoutMs: Number(process.env.CANONICAL_CLOSEOUT_TIMEOUT_VERDICT_STABLE_MS || '360000'),
  },
]

function runCheck(check) {
  const started = Date.now()
  const [cmd, ...args] = check.command
  const run = spawnSync(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: check.timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  })
  const elapsedMs = Date.now() - started
  const exitCode = typeof run.status === 'number' ? run.status : 1
  const timedOut = run.error?.code === 'ETIMEDOUT'
  return {
    id: check.id,
    command: [cmd, ...args].join(' '),
    timeoutMs: check.timeoutMs,
    exitCode,
    timedOut,
    ok: exitCode === 0 && !timedOut,
    elapsedMs,
    outputExcerpt: `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').slice(-80).join('\n'),
  }
}

function parseCutoverStartUtcMs() {
  const envValue = process.env.CANONICAL_CUTOVER_START_UTC
  if (envValue) {
    const parsed = Date.parse(envValue)
    if (Number.isFinite(parsed)) return { source: 'env', ms: parsed, raw: envValue }
  }
  const text = readFileSync(signoffPath, 'utf8')
  const m = text.match(/\*\*Window \(UTC\):\*\*\s*`([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2})`\s*->/)
  if (!m) throw new Error('Unable to parse cutover start from signoff doc')
  const iso = `${m[1]}T${m[2]}:00Z`
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid cutover start: ${iso}`)
  return { source: 'signoff-doc', ms: parsed, raw: iso }
}

const checkpointPlan = [
  { label: 'tplus8', hours: 8 },
  { label: 'tplus16', hours: 16 },
  { label: 'tplus24', hours: 24 },
]

const cutoverStart = parseCutoverStartUtcMs()
const checkpointStatus = checkpointPlan.map((x) => {
  const eligibleAtMs = cutoverStart.ms + x.hours * 60 * 60 * 1000
  const remainingMinutes = Math.max(0, Math.ceil((eligibleAtMs - nowMs) / 60000))
  return {
    label: x.label,
    hours: x.hours,
    eligibleAtUtc: new Date(eligibleAtMs).toISOString(),
    dueNow: eligibleAtMs <= nowMs,
    remainingMinutes,
  }
})
const nextCheckpoint = checkpointStatus.find((c) => !c.dueNow) || null

const results = checks.map(runCheck)
const overallOk = results.every((r) => r.ok)

const outDir = closureDir
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-closeout-status-snapshot.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-closeout-status-snapshot.md`)

const payload = {
  check: 'canonical-closeout-status-snapshot',
  timestamp: isoNow,
  cutoverStart: {
    source: cutoverStart.source,
    valueUtc: new Date(cutoverStart.ms).toISOString(),
    raw: cutoverStart.raw,
  },
  nextCheckpoint,
  checkpointStatus,
  overallOk,
  checks: results,
  notes: [
    'Single status snapshot for canonical closeout while waiting on time-gated monitoring checkpoints.',
    'Overall remains false until monitoring-complete and readiness-verdict-stable both pass.',
  ],
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical closeout status snapshot')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Overall: ${overallOk ? 'pass' : 'fail'}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
if (nextCheckpoint) {
  lines.push(
    `- Next checkpoint: ${nextCheckpoint.label} at ${nextCheckpoint.eligibleAtUtc} (remaining ${nextCheckpoint.remainingMinutes} minutes)`
  )
}
lines.push('')
lines.push('## Check results')
lines.push('')
for (const r of results) {
  lines.push(
    `- ${r.ok ? 'PASS' : 'FAIL'} ${r.id} (\`${r.command}\`, ${r.elapsedMs}ms, timeout=${r.timeoutMs}ms${r.timedOut ? ', timed out' : ''})`
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
