import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const baseUrl = process.env.PAYAID_BASE_URL
const tenantId = process.env.PAYAID_TENANT_ID
const authToken = process.env.PAYAID_AUTH_TOKEN
const outRoot = process.env.NIGHTLY_EVIDENCE_DIR || 'docs/evidence/nightly'

if (!baseUrl || !tenantId || !authToken) {
  process.stderr.write(
    'Missing required env vars: PAYAID_BASE_URL, PAYAID_TENANT_ID, PAYAID_AUTH_TOKEN.\n',
  )
  process.exit(1)
}

const now = new Date()
const dateFolder = now.toISOString().slice(0, 10)
const runStamp = now.toISOString().replace(/[:.]/g, '-')
const runDir = path.join(outRoot, dateFolder, runStamp)
const m0OutDir = path.join(runDir, 'm0-exit-metrics')
const m2OutDir = path.join(runDir, 'm2-staging-validation')

fs.mkdirSync(m0OutDir, { recursive: true })
fs.mkdirSync(m2OutDir, { recursive: true })

function runEvidenceCommand(name, command, extraEnv = {}) {
  const startedAt = new Date().toISOString()
  const result = spawnSync(command, {
    shell: true,
    encoding: 'utf8',
    env: {
      ...process.env,
      PAYAID_BASE_URL: baseUrl,
      PAYAID_TENANT_ID: tenantId,
      PAYAID_AUTH_TOKEN: authToken,
      ...extraEnv,
    },
  })
  const finishedAt = new Date().toISOString()
  return {
    name,
    command,
    started_at: startedAt,
    finished_at: finishedAt,
    exit_code: result.status ?? 1,
    success: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  }
}

const runs = [
  runEvidenceCommand('m0_exit_metrics', 'npm run collect:m0:exit-evidence', {
    M0_EVIDENCE_DIR: m0OutDir,
  }),
  runEvidenceCommand('m2_staging_validation', 'npm run collect:m2:staging-evidence', {
    M2_EVIDENCE_DIR: m2OutDir,
    M2_HTTP_TIMEOUT_MS: process.env.M2_HTTP_TIMEOUT_MS || '90000',
    M2_HTTP_RETRIES: process.env.M2_HTTP_RETRIES || '3',
  }),
]

const summary = {
  generated_at_utc: new Date().toISOString(),
  tenant_id: tenantId,
  base_url: baseUrl,
  run_directory: runDir.replace(/\\/g, '/'),
  checks: runs.map((r) => ({
    name: r.name,
    command: r.command,
    success: r.success,
    exit_code: r.exit_code,
  })),
}
summary.overall = { pass: runs.every((r) => r.success) }

const index = {
  summary,
  runs: runs.map((r) => ({
    name: r.name,
    command: r.command,
    success: r.success,
    exit_code: r.exit_code,
    started_at: r.started_at,
    finished_at: r.finished_at,
    stdout: r.stdout,
    stderr: r.stderr,
  })),
}

const indexPath = path.join(runDir, 'nightly-evidence-index.json')
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8')

process.stdout.write(`Nightly evidence index saved: ${indexPath}\n`)
process.stdout.write(`Overall pass: ${summary.overall.pass ? 'YES' : 'NO'}\n`)

if (!summary.overall.pass) {
  process.exit(1)
}

