import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const checks = [
  {
    id: 'api-modules-route',
    file: 'apps/dashboard/app/api/modules/route.ts',
    required: [
      'canonical',
      'taxonomy',
      'shouldIncludeLegacyModuleFields',
      '...(includeLegacy',
      'recommended',
      'base',
      'industry',
      'compatibility',
    ],
  },
  {
    id: 'api-industry-route',
    file: 'apps/dashboard/app/api/industries/[industry]/modules/route.ts',
    required: [
      'canonical',
      'suites',
      'capabilities',
      'optionalSuites',
      'shouldIncludeLegacyModuleFields',
      '...(includeLegacy',
      'coreModules',
      'industryPacks',
      'optionalModules',
      'compatibility',
    ],
  },
  {
    id: 'api-industry-custom-route',
    file: 'apps/dashboard/app/api/industries/custom/modules/route.ts',
    required: [
      'canonical',
      'enabledModules',
      'enabledFeatures',
      'shouldIncludeLegacyModuleFields',
      '...(includeLegacy',
      'compatibility',
    ],
  },
  {
    id: 'api-ai-analyze-industry-route',
    file: 'apps/dashboard/app/api/ai/analyze-industry/route.ts',
    required: [
      'canonical',
      'suites',
      'shouldIncludeLegacyModuleFields',
      '...(includeLegacy',
      'coreModules',
      'compatibility',
    ],
  },
]

function evaluateFileCheck(fileCheck) {
  const absPath = path.join(process.cwd(), fileCheck.file)
  const source = readFileSync(absPath, 'utf8')
  const missing = fileCheck.required.filter((token) => !source.includes(token))
  return {
    id: fileCheck.id,
    file: fileCheck.file,
    ok: missing.length === 0,
    missing,
  }
}

const fileResults = checks.map(evaluateFileCheck)
const overallOk = fileResults.every((r) => r.ok)

const payload = {
  check: 'canonical-module-api-contract',
  timestamp: isoNow,
  overallOk,
  files: fileResults,
  notes: [
    'Static contract check for canonical + legacy-gated fields.',
    'Use with CANONICAL_MODULE_API_CUTOVER_RUNBOOK during rollout gates.',
  ],
}

const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outputDir, { recursive: true })
const jsonPath = path.join(outputDir, `${stamp}-canonical-module-api-contract-check.json`)
const mdPath = path.join(outputDir, `${stamp}-canonical-module-api-contract-check.md`)

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const mdLines = []
mdLines.push('# Canonical module API contract check')
mdLines.push('')
mdLines.push(`- Timestamp: ${isoNow}`)
mdLines.push(`- Overall: ${overallOk ? 'pass' : 'fail'}`)
mdLines.push(`- JSON artifact: \`${jsonPath}\``)
mdLines.push('')
mdLines.push('## File results')
mdLines.push('')
for (const r of fileResults) {
  mdLines.push(`- ${r.ok ? 'PASS' : 'FAIL'} \`${r.file}\``)
  if (!r.ok) {
    mdLines.push(`  - missing tokens: ${r.missing.join(', ')}`)
  }
}
mdLines.push('')
mdLines.push('## Raw payload')
mdLines.push('')
mdLines.push('```json')
mdLines.push(JSON.stringify(payload, null, 2))
mdLines.push('```')
mdLines.push('')

writeFileSync(mdPath, mdLines.join('\n'), 'utf8')

console.log(JSON.stringify({ overallOk, jsonPath, mdPath }, null, 2))
process.exitCode = overallOk ? 0 : 1
