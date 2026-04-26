#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { isStrictFlagEnabled } from './strict-flag.mjs'

function isoForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function resolveTimeoutMs(globalValue, specificValue, fallbackMs) {
  const specific = Number(specificValue)
  if (Number.isFinite(specific) && specific > 0) return specific
  const global = Number(globalValue)
  if (Number.isFinite(global) && global > 0) return global
  return fallbackMs
}

function runStep(label, scriptPath, env = process.env, timeoutMs = 300000) {
  const run = spawnSync(process.execPath, [scriptPath], {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: timeoutMs,
  })
  const stdout = (run.stdout || '').trim()
  const timedOut = run.error?.name === 'Error' && /timed out/i.test(String(run.error?.message || ''))
  const stderr = `${(run.stderr || '').trim()}${timedOut ? `\nCommand timed out after ${timeoutMs}ms.` : ''}`.trim()
  let parsed = null
  try {
    parsed = stdout ? JSON.parse(stdout) : null
  } catch {
    parsed = null
  }
  return {
    label,
    scriptPath,
    ok: run.status === 0,
    exitCode: run.status ?? 1,
    timedOut,
    timeoutMs,
    parsed,
    stdout,
    stderr,
  }
}

function parseField(raw, regex) {
  return raw.match(regex)?.[1]?.trim() || null
}

const root = process.cwd()
const closureDir = join(root, 'docs', 'evidence', 'closure')
const strictMode = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_CLOSURE_STRICT)

const env = {
  ...process.env,
  LEADS_BULK_RETENTION_HEALTH_EVIDENCE_RUN_CLEANUP:
    process.env.LEADS_BULK_RETENTION_HEALTH_EVIDENCE_RUN_CLEANUP || '1',
}
const defaultTimeoutMs = resolveTimeoutMs(
  process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS,
  null,
  300000,
)

const steps = [
  runStep(
    'health-evidence',
    'scripts/run-leads-bulk-retention-health-evidence.mjs',
    env,
    resolveTimeoutMs(
      process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS,
      process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_HEALTH_EVIDENCE,
      defaultTimeoutMs,
    ),
  ),
  runStep(
    'handoff-snippet',
    'scripts/generate-leads-bulk-retention-handoff-snippet.mjs',
    env,
    resolveTimeoutMs(
      process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS,
      process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_HANDOFF_SNIPPET,
      defaultTimeoutMs,
    ),
  ),
  runStep(
    'next-actions',
    'scripts/show-leads-bulk-retention-next-actions.mjs',
    env,
    resolveTimeoutMs(
      process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS,
      process.env.LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_NEXT_ACTIONS,
      defaultTimeoutMs,
    ),
  ),
]
const overallOk = steps.every((s) => s.ok)

const latestHealthIndex = join(closureDir, 'latest-leads-bulk-retention-scheduler-health.md')
const latestSnippet = join(closureDir, 'latest-leads-bulk-retention-handoff-snippet.md')
const healthIndexRaw = existsSync(latestHealthIndex) ? readFileSync(latestHealthIndex, 'utf8') : ''
const snippetRaw = existsSync(latestSnippet) ? readFileSync(latestSnippet, 'utf8') : ''
const healthOk = parseField(healthIndexRaw, /- Health OK:\s*(.+)/)

mkdirSync(closureDir, { recursive: true })
const stamp = isoForFile(new Date())
const mdPath = join(closureDir, `${stamp}-leads-bulk-retention-closure-pack.md`)
const jsonPath = join(closureDir, `${stamp}-leads-bulk-retention-closure-pack.json`)

const payload = {
  ok: overallOk,
  strictMode,
  generatedAt: new Date().toISOString(),
  stepSummary: steps.map((s) => ({
    label: s.label,
    ok: s.ok,
    exitCode: s.exitCode,
    scriptPath: s.scriptPath,
    timedOut: s.timedOut,
    timeoutMs: s.timeoutMs,
  })),
  latestArtifacts: {
    latestHealthIndex: existsSync(latestHealthIndex) ? latestHealthIndex : null,
    latestHandoffSnippet: existsSync(latestSnippet) ? latestSnippet : null,
  },
  healthSummary: {
    healthOk,
  },
}

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = [
  '# Leads Bulk Retention Closure Pack',
  '',
  `- Generated at: ${payload.generatedAt}`,
  `- Command: \`npm run run:leads-bulk-retention-closure-pack\``,
  `- Strict mode: ${strictMode ? 'enabled' : 'disabled'}`,
  `- Overall OK: ${payload.ok ? 'yes' : 'no'}`,
  `- JSON artifact: \`${jsonPath}\``,
  '',
  '## Step Summary',
  ...payload.stepSummary.map(
    (step) => `- ${step.label}: ${step.ok ? 'pass' : 'fail'} (exit=${step.exitCode})`,
  ),
  '',
  '## Latest Health Index Snapshot',
  '',
  healthIndexRaw.trim() || '_Missing latest health index_',
  '',
  '## Latest Handoff Snippet',
  '',
  snippetRaw.trim() || '_Missing latest handoff snippet_',
]
writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ...payload,
      mdPath,
      jsonPath,
    },
    null,
    2,
  ),
)

if (!overallOk) {
  process.exit(1)
}

if (strictMode && String(healthOk || '').toLowerCase() !== 'yes') {
  process.exit(1)
}
