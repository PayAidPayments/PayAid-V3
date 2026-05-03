import { readdirSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const closureDir = path.join(root, 'docs', 'evidence', 'closure')
const releaseDir = path.join(root, 'docs', 'evidence', 'release-gates')
const softMode = process.argv.includes('--soft')
const writeMode = process.argv.includes('--write')
const formatArg = process.argv.find((arg) => arg.startsWith('--format='))
const outputMode = formatArg ? formatArg.split('=')[1] : 'lines'

function latestBySuffix(dir, suffix) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function resolveChecklistPointer() {
  const latestChecklist = latestBySuffix(closureDir, '-release-gate-warn-only-next-actions.md')
  if (latestChecklist) {
    return `docs/evidence/closure/${latestChecklist}`
  }
  const latestGate = latestBySuffix(releaseDir, '-release-gate-suite.json')
  if (!latestGate) return null
  const gateJson = JSON.parse(readFileSync(path.join(releaseDir, latestGate), 'utf8'))
  const excerpts = Array.isArray(gateJson?.results) ? gateJson.results.map((r) => String(r?.output_excerpt || '')) : []
  const merged = excerpts.join('\n')
  return (
    merged.match(/docs\/evidence\/closure\/[0-9T:\-\.]+-release-gate-warn-only-next-actions\.md/)?.[0] ??
    null
  )
}

const checklistPath = resolveChecklistPointer()
const verdictFile = latestBySuffix(closureDir, '-release-gate-warn-only-bundle-verdict.json')
const summaryFile = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-summary.json')
const indexFile = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-pack-index.json')
const handoffSchemaCheckFile = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-handoff-schema-check.json')
const pointers = {
  checklist: checklistPath ?? null,
  verdict: verdictFile ? `docs/evidence/closure/${verdictFile}` : null,
  summary: summaryFile ? `docs/evidence/closure/${summaryFile}` : null,
  index: indexFile ? `docs/evidence/closure/${indexFile}` : null,
  handoff_schema_check: handoffSchemaCheckFile ? `docs/evidence/closure/${handoffSchemaCheckFile}` : null,
}

const lines = [
  `WARN_ONLY_CHECKLIST_POINTER ${pointers.checklist ?? 'missing'}`,
  `WARN_ONLY_BUNDLE_VERDICT_POINTER ${pointers.verdict ?? 'missing'}`,
  `WARN_ONLY_POINTER_SUMMARY_POINTER ${pointers.summary ?? 'missing'}`,
  `WARN_ONLY_POINTER_PACK_INDEX_POINTER ${pointers.index ?? 'missing'}`,
  `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT_POINTER ${pointers.handoff_schema_check ?? 'missing'}`,
]
const jsonPayload = {
  checklist_pointer: pointers.checklist ?? null,
  verdict_pointer: pointers.verdict ?? null,
  summary_pointer: pointers.summary ?? null,
  pointer_pack_index_pointer: pointers.index ?? null,
  pointer_handoff_schema_check_artifact_pointer: pointers.handoff_schema_check ?? null,
}

function toMarkdown() {
  return `# Warn-only pointer pack

- checklist_pointer: ${pointers.checklist ?? 'missing'}
- verdict_pointer: ${pointers.verdict ?? 'missing'}
- summary_pointer: ${pointers.summary ?? 'missing'}
- pointer_pack_index_pointer: ${pointers.index ?? 'missing'}
- pointer_handoff_schema_check_artifact_pointer: ${pointers.handoff_schema_check ?? 'missing'}
`
}

let renderText = null
let outExt = null
if (outputMode === 'markdown') {
  renderText = toMarkdown()
  outExt = 'md'
  console.log(renderText)
} else if (outputMode === 'json') {
  renderText = JSON.stringify(jsonPayload, null, 2)
  outExt = 'json'
  console.log(renderText)
} else {
  for (const line of lines) console.log(line)
}

if (writeMode && renderText && outExt) {
  await mkdir(closureDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outPath = path.join(closureDir, `${stamp}-release-gate-warn-only-pointer-pack.${outExt}`)
  await writeFile(outPath, renderText, 'utf8')
  console.log(
    JSON.stringify(
      {
        ok: true,
        format: outputMode,
        artifact_path: path.relative(root, outPath).replaceAll('\\', '/'),
      },
      null,
      2
    )
  )
}

const allPresent =
  pointers.checklist &&
  pointers.verdict &&
  pointers.summary &&
  pointers.index &&
  pointers.handoff_schema_check
if (!allPresent && !softMode) process.exit(1)
