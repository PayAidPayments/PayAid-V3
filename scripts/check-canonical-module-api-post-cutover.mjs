import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const targets = [
  {
    id: 'api-modules-route',
    file: 'apps/dashboard/app/api/modules/route.ts',
    anchors: ['...(includeLegacy', '...(shouldIncludeLegacyModuleFields()'],
    legacyTokens: ['base:', 'industry:', 'compatibility:'],
  },
  {
    id: 'api-industry-route',
    file: 'apps/dashboard/app/api/industries/[industry]/modules/route.ts',
    anchors: ['...(includeLegacy'],
    legacyTokens: ['coreModules:', 'industryPacks:', 'optionalModules:', 'compatibility:'],
  },
  {
    id: 'api-industry-custom-route',
    file: 'apps/dashboard/app/api/industries/custom/modules/route.ts',
    anchors: ['...(includeLegacy'],
    legacyTokens: ['compatibility:'],
  },
  {
    id: 'api-ai-analyze-industry-route',
    file: 'apps/dashboard/app/api/ai/analyze-industry/route.ts',
    anchors: ['...(includeLegacy'],
    legacyTokens: ['coreModules: fallbackModules', 'coreModules: normalizedCoreModules', 'compatibility:'],
  },
]

function evaluateTarget(target) {
  const abs = path.join(process.cwd(), target.file)
  const src = readFileSync(abs, 'utf8')
  const lines = src.split('\n')
  let guardBlocks = 0

  const failures = []
  const tokenStats = target.legacyTokens.map((token) => ({
    token,
    totalOccurrences: 0,
    guardedOccurrences: 0,
  }))

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    if (target.anchors.some((anchor) => line.includes(anchor))) {
      guardBlocks += 1
    }

    for (const stat of tokenStats) {
      if (line.includes(stat.token)) {
        stat.totalOccurrences += 1
        const guarded = guardBlocks > 0
        if (guarded) {
          stat.guardedOccurrences += 1
        } else {
          failures.push({
            token: stat.token,
            line: i + 1,
            text: line.trim(),
          })
        }
      }
    }

    if (guardBlocks > 0 && /:\s*\{\}\),?/.test(line)) {
      guardBlocks -= 1
    }
  }

  return {
    id: target.id,
    file: target.file,
    ok: failures.length === 0,
    failures,
    tokenStats,
    anchorCount: target.anchors.length,
  }
}

const perFile = targets.map(evaluateTarget)
const overallOk = perFile.every((r) => r.ok)

const payload = {
  check: 'canonical-module-api-post-cutover-guard',
  timestamp: isoNow,
  overallOk,
  files: perFile,
  notes: [
    'Fails if legacy tokens appear outside includeLegacy-gated windows.',
    'Use as post-cutover regression guard for CANONICAL_MODULE_API_ONLY=1 readiness.',
  ],
}

const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-canonical-module-api-post-cutover-guard.json`)
const mdPath = path.join(outDir, `${stamp}-canonical-module-api-post-cutover-guard.md`)

writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Canonical module API post-cutover guard')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Overall: ${overallOk ? 'pass' : 'fail'}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## File results')
lines.push('')
for (const f of perFile) {
  lines.push(`- ${f.ok ? 'PASS' : 'FAIL'} \`${f.file}\``)
  if (!f.ok) {
    for (const fail of f.failures) {
      lines.push(
        `  - token \`${fail.token}\`: total=${fail.total}, guarded=${fail.guarded}, unguarded=${fail.unguarded}`
      )
    }
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

console.log(JSON.stringify({ overallOk, jsonPath, mdPath }, null, 2))
process.exitCode = overallOk ? 0 : 1
