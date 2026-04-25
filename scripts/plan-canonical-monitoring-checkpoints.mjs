import { readFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const nowMs = now.getTime()

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
const manualSignoffPath = path.join(closureDir, 'CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md')
const labels = [
  { label: 'tplus8', hours: 8 },
  { label: 'tplus16', hours: 16 },
  { label: 'tplus24', hours: 24 },
]

function parseCutoverStartUtcMs() {
  const fromEnv = process.env.CANONICAL_CUTOVER_START_UTC
  if (fromEnv) {
    const parsed = Date.parse(fromEnv)
    if (Number.isFinite(parsed)) return { source: 'env', ms: parsed, raw: fromEnv }
  }
  const text = readFileSync(manualSignoffPath, 'utf8')
  const m = text.match(/\*\*Window \(UTC\):\*\*\s*`([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2})`\s*->/)
  if (!m) throw new Error('Unable to parse cutover window start from manual signoff document.')
  const iso = `${m[1]}T${m[2]}:00Z`
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid parsed cutover start: ${iso}`)
  return { source: 'signoff-doc', ms: parsed, raw: iso }
}

const cutover = parseCutoverStartUtcMs()

const checkpointPlan = labels.map((x) => {
  const eligibleAtMs = cutover.ms + x.hours * 60 * 60 * 1000
  const remainingMs = Math.max(0, eligibleAtMs - nowMs)
  const remainingMinutes = Math.ceil(remainingMs / 60000)
  return {
    ...x,
    eligibleAtUtc: new Date(eligibleAtMs).toISOString(),
    eligibleNow: eligibleAtMs <= nowMs,
    remainingMinutes,
    command: `CANONICAL_MONITOR_CHECKPOINT_LABEL=${x.label} npm run check:canonical-monitor-checkpoint`,
  }
})

const payload = {
  generatedAtUtc: now.toISOString(),
  cutoverStart: {
    source: cutover.source,
    valueUtc: new Date(cutover.ms).toISOString(),
    raw: cutover.raw,
  },
  checkpoints: checkpointPlan,
  completionValidatorCommand: 'npm run check:canonical-monitoring-complete',
}

console.log(JSON.stringify(payload, null, 2))
