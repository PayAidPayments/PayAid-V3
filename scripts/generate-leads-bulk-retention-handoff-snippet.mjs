#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const closureDir = join(root, 'docs', 'evidence', 'closure')
const latestIndexPath = join(closureDir, 'latest-leads-bulk-retention-scheduler-health.md')
const outputPath = join(closureDir, 'latest-leads-bulk-retention-handoff-snippet.md')

if (!existsSync(latestIndexPath)) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'latest-leads-bulk-retention-scheduler-health.md not found',
        nextSteps: [
          'Run: npm run run:leads-bulk-retention-health-evidence',
          'Then rerun: npm run generate:leads-bulk-retention-handoff-snippet',
        ],
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const raw = readFileSync(latestIndexPath, 'utf8')
const get = (re) => raw.match(re)?.[1]?.trim() || null

const lastUpdated = get(/- Last updated:\s*(.+)/)
const healthOk = get(/- Health OK:\s*(.+)/)
const exitCode = get(/- Exit code:\s*(.+)/)
const jsonPath = get(/- JSON:\s*`(.+)`/)
const markdownPath = get(/- Markdown:\s*`(.+)`/)

const snippet = [
  '# Leads Bulk Retention - Release Handoff Snippet',
  '',
  '## Scheduler Health Summary',
  '- Check: leads-bulk-retention-scheduler-health',
  `- Last updated: ${lastUpdated || 'n/a'}`,
  `- Health OK: ${healthOk || 'n/a'}`,
  `- Exit code: ${exitCode || 'n/a'}`,
  `- Evidence JSON: \`${jsonPath || 'n/a'}\``,
  `- Evidence Markdown: \`${markdownPath || 'n/a'}\``,
  '',
  '## Suggested Release Note Line',
  `- Leads bulk retention scheduler health ${healthOk === 'yes' ? 'passed' : 'did not pass'} (see latest evidence artifacts above).`,
]

writeFileSync(outputPath, `${snippet.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: true,
      latestIndexPath,
      handoffSnippetPath: outputPath,
      summary: {
        lastUpdated,
        healthOk,
        exitCode,
      },
    },
    null,
    2,
  ),
)
