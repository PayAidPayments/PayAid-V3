import { readFileSync } from 'node:fs'
import path from 'node:path'

const TARGETS = [
  'docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md',
  'docs/PAYAID_V3_BLUEPRINT_GAP_CHECKLIST.md',
  'docs/VERCEL_PRODUCTION_TESTING_HANDOFF.md',
]

function findNonAsciiEntries(text) {
  const entries = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    for (let j = 0; j < line.length; j += 1) {
      const char = line[j]
      if (char.charCodeAt(0) > 127) {
        entries.push({
          line: i + 1,
          column: j + 1,
          char,
          codePoint: `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
        })
      }
    }
  }
  return entries
}

const results = TARGETS.map((relPath) => {
  const absPath = path.join(process.cwd(), relPath)
  const text = readFileSync(absPath, 'utf8')
  const nonAscii = findNonAsciiEntries(text)
  return {
    path: relPath,
    ok: nonAscii.length === 0,
    nonAsciiCount: nonAscii.length,
    samples: nonAscii.slice(0, 10),
  }
})

const overallOk = results.every((r) => r.ok)
console.log(
  JSON.stringify(
    {
      check: 'docs-ascii-safety',
      overallOk,
      targets: TARGETS,
      results,
      note: overallOk
        ? 'All tracked docs are ASCII-safe.'
        : 'One or more tracked docs contain non-ASCII characters.',
    },
    null,
    2
  )
)
process.exitCode = overallOk ? 0 : 1
