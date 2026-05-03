import { readdirSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const releaseDir = path.join(root, 'docs', 'evidence', 'release-gates')
const closureDir = path.join(root, 'docs', 'evidence', 'closure')
const allowMissingChecklist = process.argv.includes('--allow-missing-checklist')

function latestBySuffix(dir, suffix) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

const latestGate = latestBySuffix(releaseDir, '-release-gate-suite.json')
const latestChecklist = latestBySuffix(closureDir, '-release-gate-warn-only-next-actions.md')

if (!latestGate || (!latestChecklist && !allowMissingChecklist)) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: 'missing_artifacts',
        message:
          'Need latest release-gate suite JSON and warn-only checklist markdown. Run timeline gate + checklist first, or pass --allow-missing-checklist.',
      },
      null,
      2
    )
  )
  process.exit(1)
}

const gate = JSON.parse(readFileSync(path.join(releaseDir, latestGate), 'utf8'))
const excerpts = Array.isArray(gate.results) ? gate.results.map((r) => String(r?.output_excerpt || '')) : []
const mergedExcerpts = excerpts.join('\n')
const pointerFromJson = mergedExcerpts.match(
  /docs\/evidence\/closure\/[0-9T:\-\.]+-release-gate-warn-only-next-actions\.md/
)?.[0]
const checklistPath = latestChecklist ? `docs/evidence/closure/${latestChecklist}` : pointerFromJson ?? null

if (!checklistPath) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: 'missing_checklist_path',
        message:
          'Could not resolve checklist markdown path from closure directory or release-gate output excerpts.',
      },
      null,
      2
    )
  )
  process.exit(1)
}

const pointer = `WARN_ONLY_CHECKLIST_POINTER ${checklistPath}`
const warnOnlyFailures = Array.isArray(gate.results)
  ? gate.results.filter((r) => r.warn_only === true && (Number(r.exit_code) !== 0 || r.timed_out === true))
  : []

const now = new Date()
const stamp = now.toISOString().replace(/[:.]/g, '-')
await mkdir(closureDir, { recursive: true })

const summary = {
  ok: true,
  generated_at_utc: now.toISOString(),
  release_gate_artifact: `docs/evidence/release-gates/${latestGate}`,
  checklist_artifact: checklistPath,
  checklist_source: latestChecklist ? 'closure_dir' : 'release_gate_output_excerpt',
  pointer_line: pointer,
  all_pass: gate.all_pass === true,
  warn_only_failure_count: warnOnlyFailures.length,
  warn_only_failures: warnOnlyFailures.map((r) => ({
    gate: r.gate,
    exit_code: r.exit_code,
    timed_out: r.timed_out,
    duration_ms: r.duration_ms,
  })),
}

const jsonPath = path.join(closureDir, `${stamp}-release-gate-warn-only-pointer-summary.json`)
const mdPath = path.join(closureDir, `${stamp}-release-gate-warn-only-pointer-summary.md`)

const md = `# Release-gate warn-only pointer summary

- Generated: ${summary.generated_at_utc}
- Release gate artifact: ${summary.release_gate_artifact}
- Checklist artifact: ${summary.checklist_artifact}
- all_pass: ${summary.all_pass}
- warn_only_failure_count: ${summary.warn_only_failure_count}

## Pointer

\`\`\`
${summary.pointer_line}
\`\`\`
`

await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
await writeFile(mdPath, md, 'utf8')

console.log(
  JSON.stringify(
    {
      ok: true,
      pointer_line: pointer,
      json_artifact: path.relative(root, jsonPath).replaceAll('\\', '/'),
      markdown_artifact: path.relative(root, mdPath).replaceAll('\\', '/'),
    },
    null,
    2
  )
)
