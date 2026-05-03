import { readdirSync } from 'node:fs'
import path from 'node:path'

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')

function latestVerdictFile() {
  const files = readdirSync(closureDir)
    .filter((f) => f.endsWith('-release-gate-warn-only-bundle-verdict.json'))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

const latest = latestVerdictFile()
if (!latest) {
  console.log(
    'WARN_ONLY_BUNDLE_VERDICT_POINTER missing: run `npm run run:release-gate-warn-only:bundle-verdict-artifact:soft`'
  )
  process.exit(1)
}

console.log(`WARN_ONLY_BUNDLE_VERDICT_POINTER docs/evidence/closure/${latest}`)
