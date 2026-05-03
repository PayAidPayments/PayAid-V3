#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function runScript(scriptPath, env = process.env) {
  const run = spawnSync(process.execPath, [scriptPath], {
    env: { ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })
  const stdout = (run.stdout || '').trim()
  const stderr = (run.stderr || '').trim()
  return {
    exitCode: run.status ?? 1,
    stdoutJson: parseJson(stdout),
    stderrJson: parseJson(stderr),
    stdout,
    stderr,
  }
}

try {
  const preflightEvidence = runScript('scripts/run-leads-bulk-retention-health-gate-preflight-evidence.mjs', {
    ...process.env,
    LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_PREFLIGHT_EVIDENCE: '1',
    LEADS_BULK_RETENTION_HEALTH_BASE_URL: process.env.LEADS_BULK_RETENTION_HEALTH_BASE_URL || 'http://127.0.0.1:3010',
    LEADS_BULK_RETENTION_HEALTH_TENANT_ID: process.env.LEADS_BULK_RETENTION_HEALTH_TENANT_ID || 'demo-business-pvt-ltd',
  })
  const preflightPayload = preflightEvidence.stdoutJson || preflightEvidence.stderrJson
  assert(preflightEvidence.exitCode === 1, 'Case1 failed: preflight evidence should fail-fast on 1ms timeout')
  assert(preflightPayload && typeof preflightPayload === 'object', 'Case2 failed: preflight evidence should emit JSON')
  assert(typeof preflightPayload.jsonPath === 'string', 'Case3 failed: preflight evidence missing jsonPath')

  const quickTriageNextAction = runScript('scripts/run-leads-bulk-retention-health-quick-triage-next-action.mjs', {
    ...process.env,
    LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_QUICK_TRIAGE_EVIDENCE: '1',
    LEADS_BULK_RETENTION_STEP_TIMEOUT_MS_NEXT_ACTIONS: '1',
    LEADS_BULK_RETENTION_HEALTH_BASE_URL: process.env.LEADS_BULK_RETENTION_HEALTH_BASE_URL || 'http://127.0.0.1:3010',
    LEADS_BULK_RETENTION_HEALTH_TENANT_ID: process.env.LEADS_BULK_RETENTION_HEALTH_TENANT_ID || 'demo-business-pvt-ltd',
  })
  const quickPayload = quickTriageNextAction.stdoutJson || quickTriageNextAction.stderrJson
  assert(quickTriageNextAction.exitCode === 1, 'Case4 failed: quick-triage next-action should fail-fast on 1ms timeout')
  assert(quickPayload && quickPayload.steps, 'Case5 failed: quick-triage next-action should emit step JSON')
  assert(
    quickPayload.steps.quickTriageEvidence?.timedOut === true,
    'Case6 failed: quick-triage evidence step should report timedOut=true',
  )
  assert(
    quickPayload.steps.quickTriageEvidence?.timeoutMs === 1,
    'Case7 failed: quick-triage evidence step should report timeoutMs=1',
  )

  console.log(
    JSON.stringify(
      {
        ok: true,
        check: 'leads-bulk-retention-timeout-guardrails',
        cases: [
          'preflight evidence fail-fast timeout emits JSON artifact pointers',
          'quick-triage next-action propagates timedOut + timeoutMs metadata',
        ],
      },
      null,
      2,
    ),
  )
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        check: 'leads-bulk-retention-timeout-guardrails',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.exit(1)
}
