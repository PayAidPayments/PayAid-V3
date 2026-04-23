import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const SEARCH_ROOT = 'apps/dashboard'
const EXCLUDE_PATH_SNIPPETS = ['/app/api/', '\\app\\api\\', '__tests__']

function isCanonicalModuleEndpointConsumer(source) {
  const hasModulesApi = source.includes('/api/modules')
  const hasIndustryModulesApi =
    source.includes('/api/industries/') && source.includes('/modules')
  const hasAnalyzeIndustryApi = source.includes('/api/ai/analyze-industry')
  return hasModulesApi || hasIndustryModulesApi || hasAnalyzeIndustryApi
}

const LEGACY_PATTERNS = [
  /\.coreModules\b/g,
  /\.industryPacks\b/g,
  /\.optionalModules\b/g,
  /\[['"]coreModules['"]\]/g,
  /\[['"]industryPacks['"]\]/g,
  /\[['"]optionalModules['"]\]/g,
  /\bdata\??\.base\b/g,
  /\bdata\??\.recommended\b/g,
  /\bdata\??\.industry\b/g,
  /\bresponse\??\.base\b/g,
  /\bresponse\??\.recommended\b/g,
  /\bresponse\??\.industry\b/g,
]

const CANONICAL_PATTERNS = [
  /\.canonical\b/g,
  /\.taxonomy\b/g,
  /\.suites\b/g,
  /\.capabilities\b/g,
  /\.optionalSuites\b/g,
  /\[['"]canonical['"]\]/g,
  /\[['"]taxonomy['"]\]/g,
  /\[['"]suites['"]\]/g,
  /\[['"]capabilities['"]\]/g,
  /\[['"]optionalSuites['"]\]/g,
]

function discoverCandidateFiles() {
  const result = spawnSync(
    'git',
    ['ls-files', `${SEARCH_ROOT}/**/*.ts`, `${SEARCH_ROOT}/**/*.tsx`],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      shell: process.platform === 'win32',
    }
  )
  const stdout = result.stdout || ''
  return stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((rel) => path.join(process.cwd(), rel))
}

function countMatches(content, patterns) {
  let total = 0
  const matched = []
  for (const rx of patterns) {
    const hits = content.match(rx)?.length ?? 0
    if (hits > 0) {
      total += hits
      matched.push({ pattern: rx.toString(), count: hits })
    }
  }
  return { total, matched }
}

const allFiles = discoverCandidateFiles()

const consumerFiles = []
for (const file of allFiles) {
  if (EXCLUDE_PATH_SNIPPETS.some((s) => file.includes(s))) continue
  const source = readFileSync(file, 'utf8')
  if (!isCanonicalModuleEndpointConsumer(source)) continue
  const legacy = countMatches(source, LEGACY_PATTERNS)
  const canonical = countMatches(source, CANONICAL_PATTERNS)
  if (legacy.total === 0 && canonical.total === 0) continue
  consumerFiles.push({ file, source })
}

const results = consumerFiles.map(({ file, source }) => {
  const legacy = countMatches(source, LEGACY_PATTERNS)
  const canonical = countMatches(source, CANONICAL_PATTERNS)
  return {
    file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
    legacyMatches: legacy.total,
    canonicalMatches: canonical.total,
    legacyPatterns: legacy.matched,
    canonicalPatterns: canonical.matched,
    ok: legacy.total === 0 && canonical.total > 0,
  }
})

const discoveredConsumers = results.length
const failing = results.filter((r) => !r.ok)
const overallOk = discoveredConsumers > 0 && failing.length === 0

const payload = {
  check: 'canonical-module-api-consumer-usage',
  timestamp: isoNow,
  discoveredConsumers,
  overallOk,
  failures: failing,
  results,
  notes: [
    'Scans endpoint consumers for legacy response-field usage.',
    'Pass requires at least one consumer file, zero legacy matches, and canonical-field matches per consumer.',
  ],
}

const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-module-api-consumer-usage.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-module-api-consumer-usage.md`)
writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical module API consumer usage check')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Consumers discovered: ${discoveredConsumers}`)
lines.push(`- Overall: ${overallOk ? 'pass' : 'fail'}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Per-file results')
lines.push('')
if (results.length === 0) {
  lines.push('- none')
} else {
  for (const r of results) {
    lines.push(`- ${r.ok ? 'PASS' : 'FAIL'} \`${r.file}\` (legacy=${r.legacyMatches}, canonical=${r.canonicalMatches})`)
  }
}
lines.push('')
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(payload, null, 2))
lines.push('```')
lines.push('')

writeFileSync(mdPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ overallOk, jsonPath, mdPath, consumers: discoveredConsumers }, null, 2))
process.exitCode = overallOk ? 0 : 1
