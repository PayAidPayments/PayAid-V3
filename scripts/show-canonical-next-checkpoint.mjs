import { readFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const nowMs = now.getTime()

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

const cutover = parseCutoverStartUtcMs()
const plan = checkpoints.map((c) => {
  const eligibleAtMs = cutover.ms + c.hours * 60 * 60 * 1000
  const remainingMs = eligibleAtMs - nowMs
  return {
    label: c.label,
    hours: c.hours,
    eligibleAtUtc: new Date(eligibleAtMs).toISOString(),
    dueNow: remainingMs <= 0,
    remainingMinutes: Math.max(0, Math.ceil(remainingMs / 60000)),
  }
})

const next = plan.find((p) => !p.dueNow) || null
const payload = {
  generatedAtUtc: now.toISOString(),
  cutoverStart: {
    source: cutover.source,
    valueUtc: new Date(cutover.ms).toISOString(),
    raw: cutover.raw,
  },
  nextCheckpoint: next,
  plan,
  dueRunnerCommand: 'npm run run:canonical-due-monitor-checkpoints',
}

console.log(JSON.stringify(payload, null, 2))
