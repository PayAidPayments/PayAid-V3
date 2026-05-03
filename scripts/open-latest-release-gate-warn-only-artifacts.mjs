import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const root = process.cwd()
const closureDir = path.join(root, 'docs', 'evidence', 'closure')
const openArtifacts = process.argv.includes('--open')

function latestBySuffix(dir, suffix) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

function normalizeRel(relPath) {
  return String(relPath || '').replaceAll('\\', '/')
}

function toAbsolute(relPath) {
  return path.resolve(root, relPath)
}

function launchFile(absPath) {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', `"${absPath}"`], { detached: true, stdio: 'ignore' }).unref()
    return
  }
  if (process.platform === 'darwin') {
    spawn('open', [absPath], { detached: true, stdio: 'ignore' }).unref()
    return
  }
  spawn('xdg-open', [absPath], { detached: true, stdio: 'ignore' }).unref()
}

const summaryJsonName = latestBySuffix(closureDir, '-release-gate-warn-only-pointer-summary.json')
if (!summaryJsonName) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: 'missing_pointer_summary_json',
        message:
          'Run `npm run run:release-gate-warn-only-pointer-summary:allow-missing-checklist` first.',
      },
      null,
      2
    )
  )
  process.exit(1)
}

const summaryJsonRel = `docs/evidence/closure/${summaryJsonName}`
const summaryJsonAbs = toAbsolute(summaryJsonRel)
const summary = JSON.parse(readFileSync(summaryJsonAbs, 'utf8'))
const summaryMdRel = normalizeRel(summaryJsonRel).replace('.json', '.md')

const releaseGateRel = normalizeRel(summary.release_gate_artifact)
const checklistRel = normalizeRel(summary.checklist_artifact)
const artifacts = [
  { label: 'release_gate_json', rel: releaseGateRel },
  { label: 'warn_only_checklist_md', rel: checklistRel },
  { label: 'pointer_summary_json', rel: normalizeRel(summaryJsonRel) },
  { label: 'pointer_summary_md', rel: summaryMdRel },
]

const resolved = artifacts.map((a) => {
  const abs = toAbsolute(a.rel)
  return {
    ...a,
    abs,
    exists: existsSync(abs),
  }
})

if (openArtifacts) {
  for (const entry of resolved) {
    if (entry.exists) launchFile(entry.abs)
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      opened: openArtifacts,
      summary_json: normalizeRel(summaryJsonRel),
      checklist_source: summary.checklist_source || null,
      artifacts: resolved.map((a) => ({
        label: a.label,
        path: a.rel,
        exists: a.exists,
      })),
    },
    null,
    2
  )
)
