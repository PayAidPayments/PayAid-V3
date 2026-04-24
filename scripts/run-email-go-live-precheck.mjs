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
  const maxLen = 12000
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
  const elapsed = Date.now() - started
  const timedOut = result.error?.code === 'ETIMEDOUT'
  const ok = !timedOut && result.status === 0

  return {
    label,
    command: `${cmd} ${args.join(' ')}`.trim(),
    ok,
    timedOut,
    status: result.status,
    signal: result.signal,
    elapsedMs: elapsed,
    stdout: trimOutput(result.stdout),
    stderr: trimOutput(result.stderr),
    error: result.error ? String(result.error.message ?? result.error) : '',
  }
}

function parseJsonFromStdout(stdout) {
  if (!stdout) return null
  const start = stdout.lastIndexOf('{')
  if (start < 0) return null
  try {
    return JSON.parse(stdout.slice(start))
  } catch {
    return null
  }
}

function buildSummary(migrateResult, readinessResult, readinessJson) {
  const lines = []
  lines.push('# Email Go-Live Precheck')
  lines.push('')
  lines.push(`- Timestamp: ${isoNow}`)
  lines.push(`- Workspace: ${process.cwd()}`)
  lines.push(`- Timeout per command: ${RUN_TIMEOUT_MS} ms`)
  lines.push(`- Overall pass: ${migrateResult.ok && readinessResult.ok ? 'yes' : 'no'}`)
  lines.push('')
  lines.push('## Gate verdicts')
  lines.push('')
  lines.push(
    `- DB migration reachability (\`npm run db:migrate:status\`): ${migrateResult.ok ? 'PASS' : 'FAIL'}`
  )
  lines.push(
    `- Runtime readiness (\`npm run verify:email-prod-readiness\`): ${readinessResult.ok ? 'PASS' : 'FAIL'}`
  )
  lines.push('')

  if (readinessJson?.mdPath) {
    lines.push('## Readiness artifact')
    lines.push('')
    lines.push(`- Markdown: \`${readinessJson.mdPath}\``)
    lines.push(`- JSON: \`${readinessJson.jsonPath || '[missing]'}\``)
    lines.push('')
  }

  lines.push('## Raw logs')
  lines.push('')
  for (const r of [migrateResult, readinessResult]) {
    lines.push(`### ${r.label}`)
    lines.push('')
    lines.push(`- Command: \`${r.command}\``)
    lines.push(`- Exit: ${r.status ?? 'null'}`)
    lines.push(`- Signal: ${r.signal ?? 'none'}`)
    lines.push(`- Timed out: ${r.timedOut ? 'yes' : 'no'}`)
    lines.push(`- Duration ms: ${r.elapsedMs}`)
    if (r.error) lines.push(`- Error: ${r.error}`)
    lines.push('')
    lines.push('```text')
    lines.push((r.stdout || '').trim() || '[no stdout]')
    lines.push('```')
    if (r.stderr) {
      lines.push('')
      lines.push('```text')
      lines.push(r.stderr.trim())
      lines.push('```')
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

const migrateResult = runCommand('db-migrate-status', 'npm', ['run', 'db:migrate:status'])
const readinessResult = runCommand('email-prod-readiness', 'npm', ['run', 'verify:email-prod-readiness'])
const readinessJson = parseJsonFromStdout(readinessResult.stdout)

const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'email')
mkdirSync(outputDir, { recursive: true })
const outputFile = path.join(outputDir, `${stamp}-email-go-live-precheck.md`)

const summary = buildSummary(migrateResult, readinessResult, readinessJson)
writeFileSync(outputFile, summary, 'utf8')

console.log(
  JSON.stringify(
    {
      outputFile,
      migrateOk: migrateResult.ok,
      readinessOk: readinessResult.ok,
      overallOk: migrateResult.ok && readinessResult.ok,
      readinessArtifact: readinessJson?.mdPath || null,
    },
    null,
    2
  )
)

process.exit(migrateResult.ok && readinessResult.ok ? 0 : 1)

