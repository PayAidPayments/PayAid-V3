import { readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

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
  const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
  const signoffPath = path.join(closureDir, 'CANONICAL_MODULE_API_MANUAL_SIGNOFF_ONE_PASS.md')
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

function runCommand(command, timeoutMs) {
  const [cmd, ...args] = command
  const started = Date.now()
  const run = spawnSync(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  })
  const exitCode = typeof run.status === 'number' ? run.status : 1
  const timedOut = run.error?.code === 'ETIMEDOUT'
  return {
    command: [cmd, ...args].join(' '),
    elapsedMs: Date.now() - started,
    exitCode,
    timedOut,
    ok: exitCode === 0 && !timedOut,
    outputTail: `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').slice(-80),
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const args = parseCliArgs(process.argv.slice(2))
const label = args.label || 'tplus8'
const hoursByLabel = { tplus8: 8, tplus16: 16, tplus24: 24 }
const hours = hoursByLabel[label]
if (!hours) {
  console.error(JSON.stringify({ ok: false, reason: 'invalid_label', message: 'Use label tplus8|tplus16|tplus24' }, null, 2))
  process.exit(1)
}

const dryRun = args['dry-run'] === 'true' || args['dry-run'] === '1'
const pollMs = Math.max(15_000, Number(args['poll-seconds'] || process.env.CANONICAL_WAIT_POLL_SECONDS || '60') * 1000)
const maxWaitMs = Math.max(0, Number(args['max-wait-minutes'] || process.env.CANONICAL_WAIT_MAX_MINUTES || '480') * 60 * 1000)
const checkpointTimeoutMs = Number(process.env.CANONICAL_MONITOR_CHECKPOINT_TIMEOUT_MS || '240000')
const refreshTimeoutMs = Number(process.env.CANONICAL_STATUS_REFRESH_TIMEOUT_MS || '480000')

const cutover = parseCutoverStartUtcMs()
const eligibleAtMs = cutover.ms + hours * 60 * 60 * 1000
const startedAtMs = Date.now()
const polls = []

while (Date.now() < eligibleAtMs) {
  const nowMs = Date.now()
  const waitedMs = nowMs - startedAtMs
  const remainingMinutes = Math.max(0, Math.ceil((eligibleAtMs - nowMs) / 60000))
  polls.push({
    atUtc: new Date(nowMs).toISOString(),
    remainingMinutes,
    waitedMinutes: Math.floor(waitedMs / 60000),
  })
  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          label,
          cutoverStartUtc: new Date(cutover.ms).toISOString(),
          eligibleAtUtc: new Date(eligibleAtMs).toISOString(),
          remainingMinutes,
          pollSeconds: Math.floor(pollMs / 1000),
          message: 'Dry run only. No waiting command execution performed.',
        },
        null,
        2
      )
    )
    process.exit(0)
  }
  if (maxWaitMs > 0 && waitedMs >= maxWaitMs) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          timedOutWaiting: true,
          label,
          cutoverStartUtc: new Date(cutover.ms).toISOString(),
          eligibleAtUtc: new Date(eligibleAtMs).toISOString(),
          waitedMinutes: Math.floor(waitedMs / 60000),
          maxWaitMinutes: Math.floor(maxWaitMs / 60000),
          remainingMinutes,
          polls,
        },
        null,
        2
      )
    )
    process.exit(1)
  }
  await sleep(pollMs)
}

const checkpoint = runCommand(['npm', 'run', `run:canonical-monitor:${label}`], checkpointTimeoutMs)
const refresh = runCommand(['npm', 'run', 'run:canonical-status-refresh'], refreshTimeoutMs)
const ok = checkpoint.ok && refresh.ok

console.log(
  JSON.stringify(
    {
      ok,
      label,
      cutoverStartUtc: new Date(cutover.ms).toISOString(),
      eligibleAtUtc: new Date(eligibleAtMs).toISOString(),
      waitedMinutes: Math.floor((Date.now() - startedAtMs) / 60000),
      polls,
      checkpoint,
      refresh,
    },
    null,
    2
  )
)

process.exitCode = ok ? 0 : 1
