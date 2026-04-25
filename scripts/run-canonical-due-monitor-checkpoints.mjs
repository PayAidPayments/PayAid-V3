import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const now = new Date()
const nowMs = now.getTime()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
const manualSignoffPath = path.join(closureDir, 'CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md')
const labels = [
  { label: 'tplus8', hours: 8 },
  { label: 'tplus16', hours: 16 },
  { label: 'tplus24', hours: 24 },
]
const checkpointTimeoutMs = Number(process.env.CANONICAL_MONITOR_CHECKPOINT_TIMEOUT_MS || '180000')

function parseCutoverStartUtcMs() {
  const fromEnv = process.env.CANONICAL_CUTOVER_START_UTC
  if (fromEnv) {
    const parsed = Date.parse(fromEnv)
    if (Number.isFinite(parsed)) return { source: 'env', ms: parsed, raw: fromEnv }
  }
  const text = readFileSync(manualSignoffPath, 'utf8')
  const m = text.match(/\*\*Window \(UTC\):\*\*\s*`([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2})`\s*->/)
  if (!m) throw new Error('Unable to parse cutover start from signoff doc')
  const iso = `${m[1]}T${m[2]}:00Z`
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid cutover start: ${iso}`)
  return { source: 'signoff-doc', ms: parsed, raw: iso }
}

function hasArtifactForLabel(files, label) {
  const needle = `canonical-post-enable-monitor-checkpoint-${label}.md`
  return files.some((f) => f.endsWith(needle))
}

function runLabelCheckpoint(label) {
  const started = Date.now()
  const run = spawnSync('npm', ['run', 'check:canonical-monitor-checkpoint'], {
    cwd: process.cwd(),
    env: { ...process.env, CANONICAL_MONITOR_CHECKPOINT_LABEL: label },
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: checkpointTimeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  })
  const elapsedMs = Date.now() - started
  const exitCode = typeof run.status === 'number' ? run.status : 1
  const timedOut = run.error?.code === 'ETIMEDOUT'
  return {
    label,
    ok: exitCode === 0 && !timedOut,
    exitCode,
    timedOut,
    elapsedMs,
    outputExcerpt: `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').slice(-60).join('\n'),
  }
}

let files = []
try {
  files = readdirSync(closureDir)
} catch {
  files = []
}

const cutover = parseCutoverStartUtcMs()
const plan = labels.map((x) => {
  const eligibleAtMs = cutover.ms + x.hours * 60 * 60 * 1000
  const due = nowMs >= eligibleAtMs
  const alreadyCaptured = hasArtifactForLabel(files, x.label)
  return {
    label: x.label,
    hours: x.hours,
    eligibleAtUtc: new Date(eligibleAtMs).toISOString(),
    due,
    alreadyCaptured,
    shouldRun: due && !alreadyCaptured,
  }
})

const toRun = plan.filter((p) => p.shouldRun).map((p) => p.label)
const runResults = toRun.map(runLabelCheckpoint)
const runOk = runResults.every((r) => r.ok)

const payload = {
  check: 'canonical-due-monitor-checkpoints',
  timestamp: isoNow,
  cutoverStart: {
    source: cutover.source,
    valueUtc: new Date(cutover.ms).toISOString(),
    raw: cutover.raw,
  },
  checkpointTimeoutMs,
  plan,
  runLabels: toRun,
  runResults,
  overallOk: runOk,
}

mkdirSync(closureDir, { recursive: true })
const jsonPath = path.join(closureDir, `${stamp}-canonical-due-monitor-checkpoints.json`)
const mdPath = path.join(closureDir, `${stamp}-canonical-due-monitor-checkpoints.md`)
writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical due monitor checkpoints')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Cutover start: ${new Date(cutover.ms).toISOString()} (${cutover.source})`)
lines.push(`- Overall: ${runOk ? 'pass' : 'fail'}`)
lines.push(`- Due labels run: ${toRun.length > 0 ? toRun.join(', ') : 'none'}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Plan')
lines.push('')
for (const p of plan) {
  lines.push(
    `- ${p.label}: due=${p.due ? 'yes' : 'no'}, captured=${p.alreadyCaptured ? 'yes' : 'no'}, shouldRun=${p.shouldRun ? 'yes' : 'no'}, eligibleAt=${p.eligibleAtUtc}`
  )
}
lines.push('')
lines.push('## Run results')
lines.push('')
if (runResults.length === 0) {
  lines.push('- none')
} else {
  for (const r of runResults) {
    lines.push(`- ${r.ok ? 'PASS' : 'FAIL'} ${r.label} (${r.elapsedMs}ms${r.timedOut ? ', timed out' : ''})`)
  }
}
lines.push('')
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(payload, null, 2))
lines.push('```')
lines.push('')

writeFileSync(mdPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ overallOk: runOk, ran: toRun, jsonPath, mdPath }, null, 2))
process.exitCode = runOk ? 0 : 1
