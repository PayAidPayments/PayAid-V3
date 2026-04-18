import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const TEST_COMMANDS = [
  ['test:crm:tasks-filters', ['run', 'test:crm:tasks-filters']],
  ['test:crm:merge-key', ['run', 'test:crm:merge-key']],
  ['test:crm:merge-guard', ['run', 'test:crm:merge-guard']],
  ['test:crm:rbac', ['run', 'test:crm:rbac']],
]

const RUN_TIMEOUT_MS = Number(process.env.CRM_CLOSURE_TEST_TIMEOUT_MS || '120000')
const NPM_BIN = 'npm'
const SKIP_TESTS = process.env.CRM_CLOSURE_SKIP_TESTS === '1'
const SKIP_AUTH = process.env.CRM_CLOSURE_SKIP_AUTH === '1'
const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

function trimOutput(value) {
  if (!value) return ''
  const maxLen = 6000
  return value.length > maxLen ? `${value.slice(0, maxLen)}\n...[truncated]` : value
}

function runCommand(label, cmd, args, env = process.env) {
  const started = Date.now()
  const result = spawnSync(cmd, args, {
    cwd: process.cwd(),
    env,
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

function createSummary(results, authResult, authBlockedReason, outputPath) {
  const lines = []
  lines.push('# CRM GA closure blocker run')
  lines.push('')
  lines.push(`- Timestamp: ${isoNow}`)
  lines.push(`- Workspace: ${process.cwd()}`)
  lines.push(`- Output file: ${outputPath}`)
  lines.push(`- Test timeout ms: ${RUN_TIMEOUT_MS}`)
  lines.push(`- Skip tests: ${SKIP_TESTS ? 'yes' : 'no'}`)
  lines.push(`- Skip auth: ${SKIP_AUTH ? 'yes' : 'no'}`)
  lines.push('')
  lines.push('## Queue #13 — CRM unit-test confirmation')
  lines.push('')
  if (SKIP_TESTS) {
    lines.push('- status: skipped (CRM_CLOSURE_SKIP_TESTS=1)')
  } else {
    for (const r of results) {
      const state = r.ok ? 'pass' : r.timedOut ? 'timeout' : 'fail'
      lines.push(`- ${r.label}: ${state} (exit=${r.status ?? 'null'}, signal=${r.signal ?? 'none'}, ${r.elapsedMs}ms)`)
    }
  }
  lines.push('')
  lines.push('## Queue #14 — Auth speed baseline')
  lines.push('')
  if (SKIP_AUTH) {
    lines.push('- status: skipped (CRM_CLOSURE_SKIP_AUTH=1)')
  } else if (authBlockedReason) {
    lines.push(`- status: blocked (${authBlockedReason})`)
  } else if (authResult) {
    const state = authResult.ok ? 'pass' : authResult.timedOut ? 'timeout' : 'fail'
    lines.push(`- status: ${state} (exit=${authResult.status ?? 'null'}, signal=${authResult.signal ?? 'none'}, ${authResult.elapsedMs}ms)`)
  } else {
    lines.push('- status: unknown')
  }
  lines.push('')
  lines.push('## Raw command logs')
  lines.push('')
  for (const r of [...results, ...(authResult ? [authResult] : [])]) {
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

const testResults = SKIP_TESTS
  ? []
  : TEST_COMMANDS.map(([label, args]) => runCommand(label, NPM_BIN, args))

let authResult = null
let authBlockedReason = ''
if (SKIP_AUTH) {
  authBlockedReason = ''
} else if (!process.env.TENANT_ID || !process.env.AUTH_TOKEN) {
  authBlockedReason = 'TENANT_ID and AUTH_TOKEN env vars are required'
} else {
  authResult = runCommand(
    'auth-speed-sample',
    'node',
    ['scripts/crm-auth-speed-sample.mjs']
  )
}

const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outputDir, { recursive: true })
const outputFile = path.join(outputDir, `${stamp}-crm-closure-blockers.md`)
const summary = createSummary(testResults, authResult, authBlockedReason, outputFile)
writeFileSync(outputFile, summary, 'utf8')

console.log(summary)
