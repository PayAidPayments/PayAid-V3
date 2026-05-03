import { readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const now = new Date()
const nowMs = now.getTime()
const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
const signoffPath = path.join(closureDir, 'CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md')

function parseCliArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const eq = token.indexOf('=')
    if (eq > -1) {
      out[token.slice(2, eq)] = token.slice(eq + 1)
      continue
    }
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      out[key] = next
      i += 1
    } else {
      out[key] = 'true'
    }
  }
  return out
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

const args = parseCliArgs(process.argv.slice(2))
const label = args.label || ''
const hoursByLabel = { tplus8: 8, tplus16: 16, tplus24: 24 }
const hours = hoursByLabel[label]

if (!hours) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        skipped: false,
        reason: 'invalid_label',
        message: 'Provide --label tplus8|tplus16|tplus24',
      },
      null,
      2
    )
  )
  process.exit(1)
}

const cutover = parseCutoverStartUtcMs()
const eligibleAtMs = cutover.ms + hours * 60 * 60 * 1000
if (nowMs < eligibleAtMs) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        skipped: true,
        label,
        cutoverStartUtc: new Date(cutover.ms).toISOString(),
        eligibleAtUtc: new Date(eligibleAtMs).toISOString(),
        remainingMinutes: Math.ceil((eligibleAtMs - nowMs) / 60000),
        message: 'Checkpoint not due yet; skipping execution.',
      },
      null,
      2
    )
  )
  process.exit(0)
}

const run = spawnSync('npm', ['run', 'check:canonical-monitor-checkpoint', '--', '--label', label], {
  cwd: process.cwd(),
  env: process.env,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  timeout: Number(process.env.CANONICAL_MONITOR_CHECKPOINT_TIMEOUT_MS || '180000'),
  maxBuffer: 16 * 1024 * 1024,
})
const exitCode = typeof run.status === 'number' ? run.status : 1
const timedOut = run.error?.code === 'ETIMEDOUT'
const ok = exitCode === 0 && !timedOut

console.log(
  JSON.stringify(
    {
      ok,
      skipped: false,
      label,
      exitCode,
      timedOut,
      outputExcerpt: `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').slice(-60).join('\n'),
    },
    null,
    2
  )
)

process.exitCode = ok ? 0 : 1
