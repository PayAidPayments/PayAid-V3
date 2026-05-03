import { readdirSync } from 'node:fs'
import path from 'node:path'

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')

function latestPointerPackJsonFile() {
  const files = readdirSync(closureDir)
    .filter((f) => f.endsWith('-release-gate-warn-only-pointer-pack.json'))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

const latest = latestPointerPackJsonFile()
if (!latest) {
  console.log(
    'WARN_ONLY_POINTER_PACK_JSON_POINTER missing: run `npm run show:release-gate-warn-only:pointer-pack:json:write:soft`'
  )
  process.exit(1)
}

console.log(`WARN_ONLY_POINTER_PACK_JSON_POINTER docs/evidence/closure/${latest}`)
