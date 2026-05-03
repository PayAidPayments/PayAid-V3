#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function isoForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]
}

const sampleWindow = parsePositiveInt(
  process.env.MARKETING_RELEASE_EVIDENCE_LATENCY_ROLLUP_SAMPLE_WINDOW,
  20
)
const outDir = join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })

const suffix = '-marketing-release-evidence-helpers-suite.json'
const files = readdirSync(outDir)
  .filter((name) => name.endsWith(suffix))
  .sort()
const latestFiles = files.slice(-sampleWindow)

const samples = []
for (const name of latestFiles) {
  try {
    const raw = readFileSync(join(outDir, name), 'utf8')
    const parsed = JSON.parse(raw)
    const step = parsed?.summary?.steps?.find(
      (s) => s?.label === 'marketing-evidence-bundle-warn-smoke'
    )
    const elapsedMs = Number(step?.elapsedMs)
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) continue
    samples.push({
      file: name,
      capturedAt: parsed?.capturedAt || null,
      elapsedMs,
      overallOk: Boolean(parsed?.overallOk),
    })
  } catch {
    // Ignore malformed files; this rollup is best-effort.
  }
}

const sortedMs = samples.map((s) => s.elapsedMs).sort((a, b) => a - b)
const metrics = {
  sampleCount: sortedMs.length,
  p50Ms: percentile(sortedMs, 50),
  p95Ms: percentile(sortedMs, 95),
  minMs: sortedMs.length ? sortedMs[0] : null,
  maxMs: sortedMs.length ? sortedMs[sortedMs.length - 1] : null,
  latestMs: samples.length ? samples[samples.length - 1].elapsedMs : null,
}

const now = new Date()
const stamp = isoForFile(now)
const jsonPath = join(outDir, `${stamp}-marketing-release-evidence-latency-rollup.json`)
const mdPath = join(outDir, `${stamp}-marketing-release-evidence-latency-rollup.md`)
const latestIndexPath = join(outDir, 'latest-marketing-release-evidence-latency-rollup.md')

const report = {
  check: 'marketing-release-evidence-latency-rollup',
  capturedAt: now.toISOString(),
  sampleWindow,
  sourcePattern: `*${suffix}`,
  metrics,
  samples,
}
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const mdLines = [
  '# Marketing Release Evidence Latency Rollup',
  '',
  `- Captured at: ${report.capturedAt}`,
  `- Sample window: ${sampleWindow}`,
  `- Sample count: ${metrics.sampleCount}`,
  `- p50 (ms): ${metrics.p50Ms ?? 'n/a'}`,
  `- p95 (ms): ${metrics.p95Ms ?? 'n/a'}`,
  `- min (ms): ${metrics.minMs ?? 'n/a'}`,
  `- max (ms): ${metrics.maxMs ?? 'n/a'}`,
  `- latest (ms): ${metrics.latestMs ?? 'n/a'}`,
  '',
  '## Report JSON',
  '',
  '```json',
  JSON.stringify(report, null, 2),
  '```',
]
writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8')

const latestLines = [
  '# Latest Marketing Release Evidence Latency Rollup',
  '',
  `- Last updated: ${report.capturedAt}`,
  `- Sample window: ${sampleWindow}`,
  `- Sample count: ${metrics.sampleCount}`,
  `- p50 (ms): ${metrics.p50Ms ?? 'n/a'}`,
  `- p95 (ms): ${metrics.p95Ms ?? 'n/a'}`,
  `- latest (ms): ${metrics.latestMs ?? 'n/a'}`,
  '',
  '## Artifacts',
  '',
  `- JSON: \`${jsonPath}\``,
  `- Markdown: \`${mdPath}\``,
  '',
  '## Quick Command',
  '',
  '- `npm run run:marketing-release-evidence-latency-rollup`',
]
writeFileSync(latestIndexPath, `${latestLines.join('\n')}\n`, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: true,
      sampleCount: metrics.sampleCount,
      sampleWindow,
      p50Ms: metrics.p50Ms,
      p95Ms: metrics.p95Ms,
      latestMs: metrics.latestMs,
      jsonPath,
      markdownPath: mdPath,
      latestIndexPath,
    },
    null,
    2
  )
)

