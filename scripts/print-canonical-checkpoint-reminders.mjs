import { readFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
const signoffPath = path.join(closureDir, 'CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md')

const checkpoints = [
  { label: 'tplus8', hours: 8 },
  { label: 'tplus16', hours: 16 },
  { label: 'tplus24', hours: 24 },
]

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

function fmtIst(date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

const cutover = parseCutoverStartUtcMs()
const nowMs = now.getTime()
const plan = checkpoints.map((c) => {
  const atMs = cutover.ms + c.hours * 60 * 60 * 1000
  const date = new Date(atMs)
  return {
    label: c.label,
    eligibleAtUtc: date.toISOString(),
    eligibleAtIst: fmtIst(date),
    dueNow: atMs <= nowMs,
    remainingMinutes: Math.max(0, Math.ceil((atMs - nowMs) / 60000)),
    runCommand: `npm run check:canonical-monitor-checkpoint -- --label ${c.label}`,
  }
})

const payload = {
  generatedAtUtc: now.toISOString(),
  generatedAtIst: fmtIst(now),
  cutoverStart: {
    source: cutover.source,
    valueUtc: new Date(cutover.ms).toISOString(),
    valueIst: fmtIst(new Date(cutover.ms)),
    raw: cutover.raw,
  },
  reminders: plan,
  oneCommandStatus: 'npm run run:canonical-closeout-status-snapshot',
}

console.log(JSON.stringify(payload, null, 2))
