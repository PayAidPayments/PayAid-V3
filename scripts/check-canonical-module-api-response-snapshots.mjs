import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const snapshots = [
  {
    endpoint: 'GET /api/modules',
    legacyMode: {
      requiredTopLevel: ['taxonomy', 'canonical', 'compatibility', 'recommended', 'all', 'base', 'industry'],
      notes: 'Legacy compatibility fields retained when CANONICAL_MODULE_API_ONLY is not 1.',
    },
    canonicalOnlyMode: {
      requiredTopLevel: ['taxonomy', 'canonical'],
      forbiddenTopLevel: ['compatibility', 'recommended', 'all', 'base', 'industry'],
      notes: 'Canonical-only payload when CANONICAL_MODULE_API_ONLY=1.',
    },
  },
  {
    endpoint: 'GET /api/industries/[industry]/modules',
    legacyMode: {
      requiredTopLevel: [
        'industry',
        'canonical',
        'suites',
        'capabilities',
        'optionalSuites',
        'compatibility',
        'coreModules',
        'industryPacks',
        'optionalModules',
      ],
    },
    canonicalOnlyMode: {
      requiredTopLevel: ['industry', 'canonical', 'suites', 'capabilities', 'optionalSuites'],
      forbiddenTopLevel: ['compatibility', 'coreModules', 'industryPacks', 'optionalModules'],
    },
  },
  {
    endpoint: 'POST /api/industries/[industry]/modules',
    legacyMode: {
      requiredTopLevel: ['success', 'canonical', 'compatibility', 'enabledModules', 'enabledPacks'],
    },
    canonicalOnlyMode: {
      requiredTopLevel: ['success', 'canonical'],
      forbiddenTopLevel: ['compatibility', 'enabledModules', 'enabledPacks'],
    },
  },
  {
    endpoint: 'POST /api/industries/custom/modules',
    legacyMode: {
      requiredTopLevel: ['success', 'canonical', 'compatibility', 'enabledModules', 'enabledFeatures', 'industryName'],
    },
    canonicalOnlyMode: {
      requiredTopLevel: ['success', 'canonical', 'industryName'],
      forbiddenTopLevel: ['compatibility', 'enabledModules', 'enabledFeatures'],
    },
  },
  {
    endpoint: 'POST /api/ai/analyze-industry',
    legacyMode: {
      requiredTopLevel: [
        'industryName',
        'canonical',
        'industryFeatures',
        'description',
        'keyProcesses',
        'coreModules',
        'compatibility',
        'aiService',
      ],
    },
    canonicalOnlyMode: {
      requiredTopLevel: ['industryName', 'canonical', 'industryFeatures', 'description', 'keyProcesses', 'aiService'],
      forbiddenTopLevel: ['coreModules', 'compatibility'],
    },
  },
]

const payload = {
  check: 'canonical-module-api-response-snapshots',
  timestamp: isoNow,
  canonicalFlag: {
    variable: 'CANONICAL_MODULE_API_ONLY',
    legacyValue: 'unset or not 1',
    canonicalOnlyValue: '1',
  },
  snapshots,
}

const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-module-api-response-snapshots.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-module-api-response-snapshots.md`)
writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical module API response snapshots')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Endpoint snapshots')
lines.push('')
for (const s of snapshots) {
  lines.push(`### ${s.endpoint}`)
  lines.push('')
  lines.push(`- Legacy required: ${s.legacyMode.requiredTopLevel.join(', ')}`)
  if (s.legacyMode.notes) lines.push(`- Legacy note: ${s.legacyMode.notes}`)
  lines.push(`- Canonical-only required: ${s.canonicalOnlyMode.requiredTopLevel.join(', ')}`)
  if (s.canonicalOnlyMode.forbiddenTopLevel?.length) {
    lines.push(`- Canonical-only forbidden: ${s.canonicalOnlyMode.forbiddenTopLevel.join(', ')}`)
  }
  if (s.canonicalOnlyMode.notes) lines.push(`- Canonical-only note: ${s.canonicalOnlyMode.notes}`)
  lines.push('')
}
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(payload, null, 2))
lines.push('```')
lines.push('')

writeFileSync(mdPath, lines.join('\n'), 'utf8')
console.log(JSON.stringify({ overallOk: true, jsonPath, mdPath }, null, 2))
