import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')
const RUN_TIMEOUT_MS = Number(process.env.EMAIL_PRECHECK_TIMEOUT_MS || '180000')

function trimOutput(value) {
  if (!value) return ''
  const maxLen = 10000
  return value.length > maxLen ? `${value.slice(0, maxLen)}\n...[truncated]` : value
}

function runCommand(label, cmd, args) {
  const started = Date.now()
  const result = spawnSync(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    timeout: RUN_TIMEOUT_MS,
    shell: process.platform === 'win32',
  })

  const elapsedMs = Date.now() - started
  const timedOut = result.error?.code === 'ETIMEDOUT'
  const ok = !timedOut && result.status === 0
  return {
    label,
    command: `${cmd} ${args.join(' ')}`.trim(),
    ok,
    status: result.status,
    signal: result.signal,
    timedOut,
    elapsedMs,
    stdout: trimOutput(result.stdout),
    stderr: trimOutput(result.stderr),
    error: result.error ? String(result.error.message ?? result.error) : '',
  }
}

function formatCommandBlock(result) {
  const lines = []
  lines.push(`### ${result.label}`)
  lines.push('')
  lines.push(`- Command: \`${result.command}\``)
  lines.push(`- Exit: ${result.status ?? 'null'}`)
  lines.push(`- Signal: ${result.signal ?? 'none'}`)
  lines.push(`- Timed out: ${result.timedOut ? 'yes' : 'no'}`)
  lines.push(`- Duration ms: ${result.elapsedMs}`)
  if (result.error) lines.push(`- Error: ${result.error}`)
  lines.push('')
  lines.push('```text')
  lines.push((result.stdout || '').trim() || '[no stdout]')
  lines.push('```')
  if (result.stderr) {
    lines.push('')
    lines.push('```text')
    lines.push(result.stderr.trim())
    lines.push('```')
  }
  lines.push('')
  return lines
}

const envResult = runCommand('env-preflight', 'npm', ['run', 'check:email-precheck-env'])
const shouldRunHeavyPrecheck = envResult.ok
const heavyResult = shouldRunHeavyPrecheck
  ? runCommand('go-live-precheck', 'npm', ['run', 'verify:email-go-live-precheck'])
  : null

const overallOk = envResult.ok && Boolean(heavyResult?.ok)

const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
mkdirSync(outputDir, { recursive: true })
const outputFile = path.join(outputDir, `${stamp}-email-go-live-gated-precheck.md`)

const lines = []
lines.push('# Email Go-Live Gated Precheck')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Workspace: ${process.cwd()}`)
lines.push(`- Timeout per command: ${RUN_TIMEOUT_MS} ms`)
lines.push(`- Env preflight pass: ${envResult.ok ? 'yes' : 'no'}`)
lines.push(`- Heavy precheck executed: ${shouldRunHeavyPrecheck ? 'yes' : 'no'}`)
lines.push(`- Overall pass: ${overallOk ? 'yes' : 'no'}`)
lines.push('')
lines.push('## Gate behavior')
lines.push('')
if (!shouldRunHeavyPrecheck) {
  lines.push('- Heavy precheck skipped because env preflight failed.')
  lines.push('- Fix env issues first, then rerun this command.')
  lines.push('')
}
lines.push('## Command logs')
lines.push('')
lines.push(...formatCommandBlock(envResult))
if (heavyResult) {
  lines.push(...formatCommandBlock(heavyResult))
}

writeFileSync(outputFile, `${lines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      outputFile,
      envPreflightOk: envResult.ok,
      heavyPrecheckExecuted: shouldRunHeavyPrecheck,
      heavyPrecheckOk: heavyResult?.ok ?? null,
      overallOk,
    },
    null,
    2
  )
)

process.exit(overallOk ? 0 : 1)

