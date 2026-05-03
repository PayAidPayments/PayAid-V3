import { readdirSync } from 'node:fs'
import path from 'node:path'

const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')

function latestSchemaCheckArtifact() {
  const files = readdirSync(closureDir)
    .filter((f) => f.endsWith('-release-gate-warn-only-pointer-handoff-schema-check.json'))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

const latest = latestSchemaCheckArtifact()
if (!latest) {
  console.log(
    'WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT_POINTER missing: run `npm run run:release-gate-warn-only:pointer:handoff-schema-check-artifact:soft`'
  )
  process.exit(1)
}

console.log(`WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT_POINTER docs/evidence/closure/${latest}`)
