import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
const releaseDir = path.join(process.cwd(), 'docs', 'evidence', 'release-gates')
const useReleaseGateJson = process.argv.includes('--from-release-gate-json')

function latestChecklistFile() {
  const files = readdirSync(closureDir)
    .filter((f) => f.endsWith('-release-gate-warn-only-next-actions.md'))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function latestReleaseGateArtifact() {
  const files = readdirSync(releaseDir)
    .filter((f) => f.endsWith('-release-gate-suite.json'))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function checklistPathFromReleaseGateJson() {
  const latestGate = latestReleaseGateArtifact()
  if (!latestGate) return null
  const gateJson = JSON.parse(readFileSync(path.join(releaseDir, latestGate), 'utf8'))
  const excerpts = Array.isArray(gateJson?.results) ? gateJson.results.map((r) => String(r?.output_excerpt || '')) : []
  const merged = excerpts.join('\n')
  const match = merged.match(/docs\/evidence\/closure\/[0-9T:\-\.]+-release-gate-warn-only-next-actions\.md/)
  return match ? match[0] : null
}

const directFromJson = useReleaseGateJson ? checklistPathFromReleaseGateJson() : null
const latest = directFromJson ?? latestChecklistFile()

if (!latest) {
  console.log('WARN_ONLY_CHECKLIST_POINTER missing: run `npm run show:release-gate-warn-only-next-actions:markdown:write`')
  process.exit(1)
}

const rel = latest.startsWith('docs/evidence/closure/')
  ? latest
  : `docs/evidence/closure/${latest}`
console.log(`WARN_ONLY_CHECKLIST_POINTER ${rel}`)
