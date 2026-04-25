#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { isStrictFlagEnabled } from './strict-flag.mjs'

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const allowByEnv = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_ALLOW_MARKER_MUTATION)
const statusRun = spawnSync(process.execPath, ['scripts/get-leads-bulk-retention-marker-mutation-status.mjs'], {
  env: { ...process.env },
  encoding: 'utf8',
  stdio: 'pipe',
})

const statusStdout = (statusRun.stdout || '').trim()
const statusParsed = parseJson(statusStdout)
const approvalActive = Boolean(statusParsed?.active)

if (!allowByEnv && !approvalActive) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Marker archive apply blocked: no active approval.',
        approvalActive,
        allowByEnv,
        status: statusParsed,
        nextSteps: [
          'Run: npm run markers:allow-leads-mutation',
          'Check: npm run markers:status-leads-mutation',
          'Retry: npm run cleanup:leads-bulk-retention-artifacts:archive:with-markers:preflight:apply',
        ],
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const cleanupRun = spawnSync(process.execPath, ['scripts/cleanup-leads-bulk-retention-artifacts.mjs'], {
  env: {
    ...process.env,
    LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_APPLY: '1',
    LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_INCLUDE_MARKERS: '1',
    LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_MODE: 'archive',
  },
  encoding: 'utf8',
  stdio: 'pipe',
})

const cleanupStdout = (cleanupRun.stdout || '').trim()
const cleanupParsed = parseJson(cleanupStdout)

console.log(
  JSON.stringify(
    {
      ok: cleanupRun.status === 0,
      check: 'leads-bulk-retention-marker-archive-preflight',
      approvalActive,
      allowByEnv,
      cleanup: cleanupParsed,
    },
    null,
    2,
  ),
)

if (cleanupRun.status !== 0) {
  if (cleanupRun.stderr) {
    console.error(cleanupRun.stderr.trim())
  }
  process.exit(cleanupRun.status ?? 1)
}
