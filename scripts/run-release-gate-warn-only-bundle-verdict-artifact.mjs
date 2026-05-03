import { mkdir, writeFile } from 'node:fs/promises'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const closureDir = path.join(root, 'docs', 'evidence', 'closure')
const softMode = process.argv.includes('--soft')

function latestBySuffix(dir, suffix) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

const latestBundle = latestBySuffix(closureDir, '-release-gate-warn-only-artifact-pack-bundle.md')
const now = new Date()
const stamp = now.toISOString().replace(/[:.]/g, '-')
await mkdir(closureDir, { recursive: true })
const outPath = path.join(closureDir, `${stamp}-release-gate-warn-only-bundle-verdict.json`)

let payload
if (!latestBundle) {
  payload = {
    verdict: 'fail',
    artifact_path: null,
    all_pass: false,
    ok_count: 0,
    total_count: 0,
    reason: 'missing_bundle_artifact',
    hint: 'run `npm run run:release-gate-warn-only:artifact-pack-bundle:post-gate`',
  }
} else {
  const relPath = `docs/evidence/closure/${latestBundle}`
  const content = readFileSync(path.join(closureDir, latestBundle), 'utf8')
  const allPass = /- all_pass:\s*true\b/.test(content)
  const okMatches = [...content.matchAll(/- ok:\s*(true|false)\b/g)].map((m) => m[1] === 'true')
  const okCount = okMatches.filter(Boolean).length
  const totalCount = okMatches.length
  const hasAnyPass = okCount > 0
  const verdict = allPass ? 'pass' : hasAnyPass ? 'partial' : 'fail'
  payload = {
    verdict,
    artifact_path: relPath,
    all_pass: allPass,
    ok_count: okCount,
    total_count: totalCount,
  }
}

await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(
  JSON.stringify(
    {
      ok: payload.verdict === 'pass',
      verdict: payload.verdict,
      verdict_artifact: path.relative(root, outPath).replaceAll('\\', '/'),
      source_artifact: payload.artifact_path,
    },
    null,
    2
  )
)

if (!softMode && payload.verdict !== 'pass') process.exit(1)
