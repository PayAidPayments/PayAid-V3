#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isStrictFlagEnabled } from './strict-flag.mjs'

function isoForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function parseField(raw, regex) {
  return raw.match(regex)?.[1]?.trim() || null
}

const root = process.cwd()
const closureDir = join(root, 'docs', 'evidence', 'closure')
const strictMode = isStrictFlagEnabled(process.env.MARKETING_RELEASE_CLOSURE_STRICT)
const latestSmokeIndex = join(closureDir, 'latest-social-oauth-smoke.md')
const latestSmokeSnippet = join(closureDir, 'latest-social-oauth-smoke-handoff-snippet.md')
const marketingTemplate = join(closureDir, '2026-04-24-marketing-release-closure-summary-template.md')

if (!existsSync(latestSmokeIndex) || !existsSync(latestSmokeSnippet)) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Required social smoke artifacts missing',
        missing: {
          latestSmokeIndex: existsSync(latestSmokeIndex) ? null : latestSmokeIndex,
          latestSmokeSnippet: existsSync(latestSmokeSnippet) ? null : latestSmokeSnippet,
        },
        nextSteps: [
          'Run: npm run run:social-oauth-smoke-evidence',
          'Then rerun: npm run run:marketing-release-closure-pack',
        ],
      },
      null,
      2
    )
  )
  process.exit(1)
}

const smokeRaw = readFileSync(latestSmokeIndex, 'utf8')
const snippetRaw = readFileSync(latestSmokeSnippet, 'utf8')
const templateRaw = existsSync(marketingTemplate) ? readFileSync(marketingTemplate, 'utf8') : ''

const smokeSummary = {
  updatedAt: parseField(smokeRaw, /- Last updated:\s*(.+)/),
  overallOk: parseField(smokeRaw, /- Overall OK:\s*(.+)/),
  exitCode: parseField(smokeRaw, /- Exit code:\s*(.+)/),
  jsonPath: parseField(smokeRaw, /- JSON:\s*`(.+)`/),
  markdownPath: parseField(smokeRaw, /- Markdown:\s*`(.+)`/),
}
const smokePassed = String(smokeSummary.overallOk || '').toLowerCase() === 'yes'

mkdirSync(closureDir, { recursive: true })
const stamp = isoForFile(new Date())
const outputPath = join(closureDir, `${stamp}-marketing-release-closure-pack.md`)

const lines = [
  '# Marketing Release Closure Pack',
  '',
  `- Generated at: ${new Date().toISOString()}`,
  `- Pack command: \`npm run run:marketing-release-closure-pack\``,
  `- Strict mode: ${strictMode ? 'enabled' : 'disabled'}`,
  '',
  '## Social OAuth Smoke Snapshot',
  `- Last updated: ${smokeSummary.updatedAt || 'n/a'}`,
  `- Overall OK: ${smokeSummary.overallOk || 'n/a'}`,
  `- Exit code: ${smokeSummary.exitCode || 'n/a'}`,
  `- Evidence JSON: \`${smokeSummary.jsonPath || 'n/a'}\``,
  `- Evidence Markdown: \`${smokeSummary.markdownPath || 'n/a'}\``,
  '',
  '## Social OAuth Release Snippet',
  '',
  snippetRaw.trim(),
]

if (templateRaw.trim()) {
  lines.push(
    '',
    '## Marketing Closure Template Reference',
    '',
    `- Source template: \`${marketingTemplate}\``,
    '',
    '```markdown',
    templateRaw.trim(),
    '```'
  )
}

writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')

const payload = {
  ok: true,
  outputPath,
  strictMode,
  smokePassed,
  smokeSummary,
  inputs: {
    latestSmokeIndex,
    latestSmokeSnippet,
    marketingTemplate: existsSync(marketingTemplate) ? marketingTemplate : null,
  },
}

if (strictMode && !smokePassed) {
  console.log(
    JSON.stringify(
      {
        ...payload,
        ok: false,
        error:
          'Strict mode failed: latest social OAuth smoke status is not pass (Overall OK is not "yes").',
      },
      null,
      2
    )
  )
  process.exit(1)
}

console.log(JSON.stringify(payload, null, 2))

