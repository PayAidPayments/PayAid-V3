#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const clear = process.argv.includes('--clear')
const ttlMinutes = Number(process.env.MARKER_MUTATION_APPROVAL_TTL_MINUTES || 30)
const untilArgIndex = process.argv.findIndex((a) => a === '--until')
const untilArgValue = untilArgIndex >= 0 ? process.argv[untilArgIndex + 1] : ''
const untilEnvValue = (process.env.MARKER_MUTATION_APPROVAL_UNTIL_ISO || '').trim()
const maxWindowHours = Number(process.env.MARKER_MUTATION_APPROVAL_MAX_WINDOW_HOURS || 24)
const enforceMaxWindow = process.env.MARKER_MUTATION_APPROVAL_ENFORCE_MAX_WINDOW === '1'
const markersDir = join(process.cwd(), 'docs', 'evidence', 'closure', 'markers')
const approvalFile = join(markersDir, 'ALLOW_MARKER_MUTATION')

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
      2
    )
  )
  process.exit(0)
}

mkdirSync(markersDir, { recursive: true })
const createdAt = new Date()
let expiresAt = new Date(createdAt.getTime() + ttlMinutes * 60 * 1000)
const untilRaw = (untilArgValue || untilEnvValue || '').trim()
if (untilRaw) {
  const parsed = new Date(untilRaw)
  if (Number.isNaN(parsed.getTime())) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: 'Invalid --until/ MARKER_MUTATION_APPROVAL_UNTIL_ISO value (must be ISO datetime)',
          received: untilRaw,
        },
        null,
        2
      )
    )
    process.exit(1)
  }
  if (parsed.getTime() <= createdAt.getTime()) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: 'Approval expiry must be in the future',
          received: untilRaw,
          now: createdAt.toISOString(),
        },
        null,
        2
      )
    )
    process.exit(1)
  }
  expiresAt = parsed
}
const windowMs = expiresAt.getTime() - createdAt.getTime()
const exceedsMaxWindow = windowMs > maxWindowHours * 60 * 60 * 1000
if (exceedsMaxWindow && enforceMaxWindow) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Approval window exceeds max policy window',
        maxWindowHours,
        requestedHours: Number((windowMs / (60 * 60 * 1000)).toFixed(2)),
      },
      null,
      2
    )
  )
  process.exit(1)
}
writeFileSync(
  approvalFile,
  [
    '# Marker mutation approval file',
    `# Created at: ${createdAt.toISOString()}`,
    `# Expires at: ${expiresAt.toISOString()}`,
    `expiresAt=${expiresAt.toISOString()}`,
    '# Remove this file to re-enable marker mutation safety lock.',
    '',
  ].join('\n'),
  'utf8'
)

console.log(
  JSON.stringify(
    {
      ok: true,
      action: 'created',
      approvalFile,
      ttlMinutes,
      mode: untilRaw ? 'absolute-until' : 'ttl-minutes',
      expiresAt: expiresAt.toISOString(),
      maxWindowHours,
      exceedsMaxWindow,
      warning:
        exceedsMaxWindow && !enforceMaxWindow
          ? `Approval window exceeds ${maxWindowHours}h policy window (non-blocking warning).`
          : null,
      nextSteps: [
        '$env:MARKETING_RELEASE_CLEANUP_INCLUDE_MARKERS="1"',
        '$env:MARKETING_RELEASE_CLEANUP_ALLOW_MARKER_MUTATION="1"',
        'npm run cleanup:marketing-release-artifacts:archive:apply',
      ],
    },
    null,
    2
  )
)

