#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const clear = process.argv.includes('--clear')
const ttlMinutes = Number(process.env.MARKER_MUTATION_APPROVAL_TTL_MINUTES || 30)
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
const expiresAt = new Date(createdAt.getTime() + ttlMinutes * 60 * 1000)
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
      expiresAt: expiresAt.toISOString(),
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

