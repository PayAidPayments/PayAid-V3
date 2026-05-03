#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const clear = process.argv.includes('--clear')
const ttlMinutes = Number(process.env.LEADS_MARKER_MUTATION_APPROVAL_TTL_MINUTES || 30)
const markersDir = join(process.cwd(), 'docs', 'evidence', 'closure', 'markers')
const approvalFile = join(markersDir, 'ALLOW_LEADS_BULK_RETENTION_MARKER_MUTATION')

function parseExpiry(filePath) {
  if (!existsSync(filePath)) return null
  const raw = readFileSync(filePath, 'utf8')
  const expiresAt = raw.match(/expiresAt=(.+)/)?.[1]?.trim() || null
  const expiresAtMs = Date.parse(String(expiresAt || ''))
  if (!Number.isFinite(expiresAtMs)) return null
  return { expiresAt, expired: Date.now() > expiresAtMs }
}

if (clear) {
  rmSync(approvalFile, { force: true })
  console.log(
    JSON.stringify(
      {
        ok: true,
        action: 'cleared',
        approvalFile,
      },
      null,
      2,
    ),
  )
  process.exit(0)
}

mkdirSync(markersDir, { recursive: true })
const createdAt = new Date()
const expiresAt = new Date(createdAt.getTime() + ttlMinutes * 60 * 1000)
writeFileSync(
  approvalFile,
  [
    '# Leads marker mutation approval file',
    `# Created at: ${createdAt.toISOString()}`,
    `# Expires at: ${expiresAt.toISOString()}`,
    `expiresAt=${expiresAt.toISOString()}`,
    '# Remove this file to re-enable marker mutation safety lock.',
    '',
  ].join('\n'),
  'utf8',
)

const status = parseExpiry(approvalFile)
console.log(
  JSON.stringify(
    {
      ok: true,
      action: 'created',
      approvalFile,
      ttlMinutes,
      expiresAt: expiresAt.toISOString(),
      status,
      nextSteps: [
        '$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_INCLUDE_MARKERS="1"',
        '$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_APPLY="1"',
        'npm run cleanup:leads-bulk-retention-artifacts:archive:with-markers:apply',
      ],
    },
    null,
    2,
  ),
)
