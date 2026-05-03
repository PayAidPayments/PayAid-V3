#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const closureDir = join(root, 'docs', 'evidence', 'closure')
const latestIndexPath = join(closureDir, 'latest-social-oauth-smoke.md')
const outputPath = join(closureDir, 'latest-social-oauth-smoke-handoff-snippet.md')

if (!existsSync(latestIndexPath)) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'latest-social-oauth-smoke.md not found',
        nextSteps: [
          'Run: npm run run:social-oauth-smoke-evidence',
          'Then rerun: npm run generate:social-oauth-smoke-handoff-snippet',
        ],
      },
      null,
      2
    )
  )
  process.exit(1)
}

const raw = readFileSync(latestIndexPath, 'utf8')
const get = (re) => raw.match(re)?.[1]?.trim() || null

const lastUpdated = get(/- Last updated:\s*(.+)/)
const overallOk = get(/- Overall OK:\s*(.+)/)
const exitCode = get(/- Exit code:\s*(.+)/)
const jsonPath = get(/- JSON:\s*`(.+)`/)
const markdownPath = get(/- Markdown:\s*`(.+)`/)

const snippet = [
  '# Social OAuth Smoke - Release Handoff Snippet',
  '',
  '## QA Evidence Summary',
  `- Check: social-oauth-connectors-smoke`,
  `- Last updated: ${lastUpdated || 'n/a'}`,
  `- Overall OK: ${overallOk || 'n/a'}`,
  `- Exit code: ${exitCode || 'n/a'}`,
  `- Evidence JSON: \`${jsonPath || 'n/a'}\``,
  `- Evidence Markdown: \`${markdownPath || 'n/a'}\``,
  '',
  '## Suggested Release Note Line',
  `- Social OAuth connector smoke ${overallOk === 'yes' ? 'passed' : 'did not pass'} (see latest evidence artifacts above).`,
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
        overallOk,
        exitCode,
      },
    },
    null,
    2
  )
)

