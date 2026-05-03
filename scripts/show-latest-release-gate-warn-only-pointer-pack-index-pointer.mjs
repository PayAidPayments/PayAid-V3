import { readdirSync } from 'node:fs'
import path from 'node:path'

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')

function latestPointerPackIndexFile() {
  const files = readdirSync(closureDir)
    .filter((f) => f.endsWith('-release-gate-warn-only-pointer-pack-index.json'))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

const latest = latestPointerPackIndexFile()
if (!latest) {
  console.log(
    'WARN_ONLY_POINTER_PACK_INDEX_POINTER missing: run `npm run run:release-gate-warn-only:pointer-pack:index:soft`'
  )
  process.exit(1)
}

console.log(`WARN_ONLY_POINTER_PACK_INDEX_POINTER docs/evidence/closure/${latest}`)
