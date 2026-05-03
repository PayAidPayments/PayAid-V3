import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
const requiredLabels = ['tplus8', 'tplus16', 'tplus24']
const manualSignoffPath = path.join(closureDir, 'CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md')

function latestArtifactForLabel(files, label) {
  const needle = `canonical-post-enable-monitor-checkpoint-${label}.md`
  const matches = files.filter((f) => f.endsWith(needle)).sort()
  return matches.length > 0 ? matches[matches.length - 1] : null
}

function parseCutoverStartUtcMs() {
  const fromEnv = process.env.CANONICAL_CUTOVER_START_UTC
  if (fromEnv) {
    const parsed = Date.parse(fromEnv)
    if (Number.isFinite(parsed)) return { source: 'env', ms: parsed, raw: fromEnv }
  }
  try {
    const text = readFileSync(manualSignoffPath, 'utf8')
    const m = text.match(/\*\*Window \(UTC\):\*\*\s*`([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2})`\s*->/)
    if (!m) return { source: 'none', ms: null, raw: null }
    const iso = `${m[1]}T${m[2]}:00Z`
    const parsed = Date.parse(iso)
    return Number.isFinite(parsed) ? { source: 'signoff-doc', ms: parsed, raw: iso } : { source: 'none', ms: null, raw: null }
  } catch {
    return { source: 'none', ms: null, raw: null }
  }
}

function parseArtifactTimestampMs(fileName) {
  const m = fileName.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{3}Z)-/)
  if (!m) return null
  const normalized = m[1]
    .replace(/^([0-9]{4}-[0-9]{2}-[0-9]{2})T/, '$1T')
    .replace(/T([0-9]{2})-([0-9]{2})-([0-9]{2})-([0-9]{3})Z$/, 'T$1:$2:$3.$4Z')
  const parsed = Date.parse(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function run() {
  let files = []
  try {
    files = readdirSync(closureDir)
  } catch {
    return {
      mode: 'blocked',
      blockers: [`Closure directory missing: ${closureDir}`],
      checkpoints: [],
      overallOk: false,
    }
  }

  const cutoverStart = parseCutoverStartUtcMs()
  const requiredHoursByLabel = { tplus8: 8, tplus16: 16, tplus24: 24 }

  const checkpoints = requiredLabels.map((label) => {
    const artifact = latestArtifactForLabel(files, label)
    const artifactMs = artifact ? parseArtifactTimestampMs(artifact) : null
    const requiredHours = requiredHoursByLabel[label] || 0
    const eligibleAtMs =
      cutoverStart.ms !== null ? cutoverStart.ms + requiredHours * 60 * 60 * 1000 : null
    const elapsedEligible =
      artifactMs !== null && eligibleAtMs !== null ? artifactMs >= eligibleAtMs : false
    return {
      label,
      present: Boolean(artifact),
      artifact: artifact ? `docs/evidence/closure/${artifact}` : null,
      artifactTimestampUtc: artifactMs !== null ? new Date(artifactMs).toISOString() : null,
      requiredHours,
      eligibleAtUtc: eligibleAtMs !== null ? new Date(eligibleAtMs).toISOString() : null,
      elapsedEligible,
    }
  })

  const missing = checkpoints.filter((c) => !c.present).map((c) => c.label)
  const tooEarly = checkpoints.filter((c) => c.present && !c.elapsedEligible).map((c) => c.label)
  return {
    mode: 'executed',
    overallOk: missing.length === 0 && tooEarly.length === 0 && cutoverStart.ms !== null,
    cutoverStart,
    checkpoints,
    missingLabels: missing,
    tooEarlyLabels: tooEarly,
  }
}

const result = run()

mkdirSync(closureDir, { recursive: true })
const jsonPath = path.join(closureDir, `${stamp}-canonical-monitoring-complete-check.json`)
const mdPath = path.join(closureDir, `${stamp}-canonical-monitoring-complete-check.md`)

const payload = {
  check: 'canonical-monitoring-complete-check',
  timestamp: isoNow,
  requiredLabels,
  ...result,
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical monitoring complete check')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Overall: ${result.overallOk ? 'pass' : 'fail'}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push(
  `- Cutover start source: ${result.cutoverStart?.source || 'none'}${
    result.cutoverStart?.raw ? ` (\`${result.cutoverStart.raw}\`)` : ''
  }`
)
lines.push('')
lines.push('## Required checkpoints')
lines.push('')
for (const checkpoint of result.checkpoints || []) {
  const status = !checkpoint.present ? 'MISSING' : checkpoint.elapsedEligible ? 'PASS' : 'TOO_EARLY'
  lines.push(
    `- ${status} ${checkpoint.label}${
      checkpoint.artifact ? ` -> \`${checkpoint.artifact}\`` : ''
    }${checkpoint.eligibleAtUtc ? ` (eligible after ${checkpoint.eligibleAtUtc})` : ''}`
  )
}
if (result.missingLabels?.length) {
  lines.push('')
  lines.push(`- Missing labels: ${result.missingLabels.join(', ')}`)
}
if (result.tooEarlyLabels?.length) {
  lines.push(`- Too-early labels: ${result.tooEarlyLabels.join(', ')}`)
}
lines.push('')
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(payload, null, 2))
lines.push('```')
lines.push('')

writeFileSync(mdPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ overallOk: result.overallOk, jsonPath, mdPath }, null, 2))
process.exitCode = result.overallOk ? 0 : 1
