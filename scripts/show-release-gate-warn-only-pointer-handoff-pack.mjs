import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

// Exit behavior matrix:
// - soft mode: always exits 0 (status still printed)
// - strict mode: exits 1 for invalid/incompatible schema checks
// - strict mode + non-schema-check-only: exits 1 when required pointers are missing (checklist, verdict, summary, pointer-pack json/index, handoff schema-check artifact)
const root = process.cwd()
const closureDir = path.join(root, 'docs', 'evidence', 'closure')
const releaseDir = path.join(root, 'docs', 'evidence', 'release-gates')
const softMode = process.argv.includes('--soft')
const singleLineMode = process.argv.includes('--single-line')
const jsonLineMode = process.argv.includes('--json-line')
const strictSchemaMode = process.argv.includes('--strict-schema')
const schemaCheckOnlyMode = process.argv.includes('--schema-check-only')
const schemaCheckJsonLineMode = process.argv.includes('--schema-check-json-line')
const schemaCheckCodeOnlyMode = process.argv.includes('--schema-check-code-only')
const schemaCheckEnvLineMode = process.argv.includes('--schema-check-env-line')
const prefixArg = process.argv.find((arg) => arg.startsWith('--prefix='))
const prefix = prefixArg ? prefixArg.split('=')[1] : null
const minSchemaArg = process.argv.find((arg) => arg.startsWith('--min-schema-version='))
const minSchemaVersion = minSchemaArg ? Number(minSchemaArg.split('=')[1]) : null
const currentSchemaVersion = 1

function latestBySuffix(dir, suffix) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function resolveChecklistPointer() {
  const latestChecklist = latestBySuffix(closureDir, '-release-gate-warn-only-next-actions.md')
  if (latestChecklist) return `docs/evidence/closure/${latestChecklist}`

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
const pointerPackJsonFile = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-pack.json')
const pointerPackIndexFile = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-pack-index.json')
const handoffSchemaCheckFile = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-handoff-schema-check.json')

const lines = [
  `WARN_ONLY_CHECKLIST_POINTER ${checklistPath ?? 'missing'}`,
  `WARN_ONLY_BUNDLE_VERDICT_POINTER ${verdictFile ? `docs/evidence/closure/${verdictFile}` : 'missing'}`,
  `WARN_ONLY_POINTER_SUMMARY_POINTER ${summaryFile ? `docs/evidence/closure/${summaryFile}` : 'missing'}`,
  `WARN_ONLY_POINTER_PACK_JSON_POINTER ${pointerPackJsonFile ? `docs/evidence/closure/${pointerPackJsonFile}` : 'missing'}`,
  `WARN_ONLY_POINTER_PACK_INDEX_POINTER ${pointerPackIndexFile ? `docs/evidence/closure/${pointerPackIndexFile}` : 'missing'}`,
  `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_ARTIFACT_POINTER ${handoffSchemaCheckFile ? `docs/evidence/closure/${handoffSchemaCheckFile}` : 'missing'}`,
]

const jsonLinePayload = {
  checklist_pointer: checklistPath ?? 'missing',
  bundle_verdict_pointer: verdictFile ? `docs/evidence/closure/${verdictFile}` : 'missing',
  pointer_summary_pointer: summaryFile ? `docs/evidence/closure/${summaryFile}` : 'missing',
  pointer_pack_json_pointer: pointerPackJsonFile ? `docs/evidence/closure/${pointerPackJsonFile}` : 'missing',
  pointer_pack_index_pointer: pointerPackIndexFile ? `docs/evidence/closure/${pointerPackIndexFile}` : 'missing',
  pointer_handoff_schema_check_artifact_pointer: handoffSchemaCheckFile
    ? `docs/evidence/closure/${handoffSchemaCheckFile}`
    : 'missing',
}

if (!schemaCheckOnlyMode && jsonLineMode) {
  const payload = strictSchemaMode
    ? {
        schema_version: currentSchemaVersion,
        prefix: prefix ?? null,
        checklist_pointer: jsonLinePayload.checklist_pointer,
        bundle_verdict_pointer: jsonLinePayload.bundle_verdict_pointer,
        pointer_summary_pointer: jsonLinePayload.pointer_summary_pointer,
        pointer_pack_json_pointer: jsonLinePayload.pointer_pack_json_pointer,
        pointer_pack_index_pointer: jsonLinePayload.pointer_pack_index_pointer,
        pointer_handoff_schema_check_artifact_pointer: jsonLinePayload.pointer_handoff_schema_check_artifact_pointer,
      }
    : prefix
      ? { prefix, ...jsonLinePayload }
      : jsonLinePayload
  console.log(JSON.stringify(payload))
} else if (!schemaCheckOnlyMode && singleLineMode) {
  const oneLine = lines
    .map((line) => {
      const firstSpace = line.indexOf(' ')
      const key = line.slice(0, firstSpace)
      const value = line.slice(firstSpace + 1)
      return `${key}=${value}`
    })
    .join(' ')
  console.log(prefix ? `${prefix} ${oneLine}` : oneLine)
} else if (!schemaCheckOnlyMode) {
  for (const line of lines) console.log(line)
}

let schemaCheckStatus = null
if (minSchemaArg || schemaCheckOnlyMode) {
  const requiredMinSchemaVersion = minSchemaArg ? minSchemaVersion : currentSchemaVersion
  const minLooksValid =
    Number.isFinite(requiredMinSchemaVersion) &&
    Number.isInteger(requiredMinSchemaVersion) &&
    requiredMinSchemaVersion >= 1

  const emitSchemaStatus = (status, reason = null) => {
    const schemaCheckCode = status === 'compatible' ? 0 : status === 'incompatible' ? 1 : 2
    if (schemaCheckEnvLineMode) {
      const fields = [
        `TIMELINE_WARN_ONLY_SCHEMA_CHECK_CODE=${schemaCheckCode}`,
        `TIMELINE_WARN_ONLY_SCHEMA_CHECK_STATUS=${status}`,
        `TIMELINE_WARN_ONLY_SCHEMA_VERSION=${currentSchemaVersion}`,
        `TIMELINE_WARN_ONLY_REQUIRED_MIN_SCHEMA_VERSION=${requiredMinSchemaVersion}`,
      ]
      if (reason) fields.push(`TIMELINE_WARN_ONLY_SCHEMA_CHECK_REASON=${reason}`)
      if (prefix) fields.push(`TIMELINE_WARN_ONLY_SCHEMA_CHECK_PREFIX=${prefix}`)
      console.log(fields.join(' '))
      return
    }
    if (schemaCheckCodeOnlyMode) {
      console.log(`WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK_CODE ${schemaCheckCode}`)
      return
    }
    if (schemaCheckJsonLineMode) {
      const payload = {
        schema_version: currentSchemaVersion,
        required_min_schema_version: requiredMinSchemaVersion,
        prefix: prefix ?? null,
        status,
        schema_check_code: schemaCheckCode,
      }
      if (reason) payload.reason = reason
      console.log(JSON.stringify(payload))
      return
    }
    if (status === 'invalid') {
      console.log('WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK invalid-min-schema-version')
      return
    }
    console.log(
      `WARN_ONLY_POINTER_HANDOFF_SCHEMA_CHECK ${status} current=${currentSchemaVersion} required_min=${requiredMinSchemaVersion}`
    )
  }

  if (!minLooksValid) {
    schemaCheckStatus = 'invalid'
    emitSchemaStatus(schemaCheckStatus, 'invalid-min-schema-version')
  } else if (currentSchemaVersion < requiredMinSchemaVersion) {
    schemaCheckStatus = 'incompatible'
    emitSchemaStatus(schemaCheckStatus)
  } else {
    schemaCheckStatus = 'compatible'
    emitSchemaStatus(schemaCheckStatus)
  }
}

const allPresent =
  checklistPath &&
  verdictFile &&
  summaryFile &&
  pointerPackJsonFile &&
  pointerPackIndexFile &&
  handoffSchemaCheckFile
const shouldFailSchemaCheck = (minSchemaArg || schemaCheckOnlyMode) && schemaCheckStatus !== 'compatible'

const shouldFailMissingPointers = !schemaCheckOnlyMode && !allPresent
if (!softMode && (shouldFailSchemaCheck || shouldFailMissingPointers)) process.exit(1)
