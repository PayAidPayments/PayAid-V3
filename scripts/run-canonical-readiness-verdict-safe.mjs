import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')
const timeoutMs = Number(process.env.CANONICAL_READINESS_VERDICT_TIMEOUT_MS || '180000')

const started = Date.now()
const run = spawnSync('npm', ['run', 'check:canonical-module-api-readiness-verdict'], {
  cwd: process.cwd(),
  env: process.env,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  timeout: timeoutMs,
  maxBuffer: 16 * 1024 * 1024,
})
const elapsedMs = Date.now() - started
const timedOut = run.error?.code === 'ETIMEDOUT'
const exitCode = typeof run.status === 'number' ? run.status : 1
const overallOk = !timedOut && exitCode === 0

const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-module-api-readiness-verdict-safe.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-module-api-readiness-verdict-safe.md`)

const payload = {
  check: 'canonical-module-api-readiness-verdict-safe',
  timestamp: isoNow,
  timeoutMs,
  elapsedMs,
  timedOut,
  exitCode,
  overallOk,
  stdoutTail: (run.stdout || '').split('\n').slice(-80),
  stderrTail: (run.stderr || '').split('\n').slice(-80),
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical readiness verdict (safe wrapper)')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Overall: ${overallOk ? 'pass' : 'fail'}`)
lines.push(`- Timed out: ${timedOut ? 'yes' : 'no'}`)
lines.push(`- Timeout (ms): ${timeoutMs}`)
lines.push(`- Elapsed (ms): ${elapsedMs}`)
lines.push(`- Exit code: ${exitCode}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Stdout tail')
lines.push('')
lines.push('```')
lines.push((run.stdout || '').split('\n').slice(-80).join('\n'))
lines.push('```')
lines.push('')
lines.push('## Stderr tail')
lines.push('')
lines.push('```')
lines.push((run.stderr || '').split('\n').slice(-80).join('\n'))
lines.push('```')
lines.push('')

writeFileSync(mdPath, lines.join('\n'), 'utf8')

console.log(JSON.stringify({ overallOk, timedOut, exitCode, jsonPath, mdPath }, null, 2))
process.exitCode = overallOk ? 0 : 1
