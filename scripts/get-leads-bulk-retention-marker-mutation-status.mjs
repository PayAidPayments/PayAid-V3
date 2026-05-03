#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const markersDir = join(process.cwd(), 'docs', 'evidence', 'closure', 'markers')
const approvalFile = join(markersDir, 'ALLOW_LEADS_BULK_RETENTION_MARKER_MUTATION')

if (!existsSync(approvalFile)) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        active: false,
        expired: null,
        approvalFile,
        reason: 'missing_approval_file',
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

const raw = readFileSync(approvalFile, 'utf8')
const expiresAt = raw.match(/expiresAt=(.+)/)?.[1]?.trim() || null
const expiresAtMs = Date.parse(String(expiresAt || ''))
if (!Number.isFinite(expiresAtMs)) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        active: false,
        expired: null,
        approvalFile,
        reason: 'invalid_expiry_format',
        expiresAt,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const nowMs = Date.now()
const expired = nowMs > expiresAtMs
const remainingMinutes = expired ? 0 : Math.max(0, Math.round((expiresAtMs - nowMs) / 60000))

console.log(
  JSON.stringify(
    {
      ok: true,
      active: !expired,
      expired,
      approvalFile,
      expiresAt,
      remainingMinutes,
    },
    null,
    2,
  ),
)
