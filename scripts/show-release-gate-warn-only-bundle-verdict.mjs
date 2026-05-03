import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const closureDir = path.join(root, 'docs', 'evidence', 'closure')
const softMode = process.argv.includes('--soft')
const jsonMode = process.argv.includes('--json')

function latestBySuffix(dir, suffix) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .sort()
  return files.length > 0 ? files[files.length - 1] : null
}

const latestBundle = latestBySuffix(closureDir, '-release-gate-warn-only-artifact-pack-bundle.md')

if (!latestBundle) {
  const missingPayload = {
    verdict: 'fail',
    artifact_path: null,
    all_pass: false,
    ok_count: 0,
    total_count: 0,
    reason: 'missing_bundle_artifact',
    hint: 'run `npm run run:release-gate-warn-only:artifact-pack-bundle:post-gate`',
  }
  if (jsonMode) {
    console.log(JSON.stringify(missingPayload, null, 2))
  } else {
    console.log(
      'TIMELINE_WARN_ONLY_BUNDLE_VERDICT fail missing:run `npm run run:release-gate-warn-only:artifact-pack-bundle:post-gate`'
    )
  }
  if (!softMode) process.exit(1)
  process.exit(0)
}

const relPath = `docs/evidence/closure/${latestBundle}`
const content = readFileSync(path.join(closureDir, latestBundle), 'utf8')
const allPass = /- all_pass:\s*true\b/.test(content)
const okMatches = [...content.matchAll(/- ok:\s*(true|false)\b/g)].map((m) => m[1] === 'true')
const okCount = okMatches.filter(Boolean).length
const totalCount = okMatches.length
const hasAnyPass = okCount > 0

const verdict = allPass ? 'pass' : hasAnyPass ? 'partial' : 'fail'
const payload = {
  verdict,
  artifact_path: relPath,
  all_pass: allPass,
  ok_count: okCount,
  total_count: totalCount,
}

if (jsonMode) {
  console.log(JSON.stringify(payload, null, 2))
} else {
  console.log(`TIMELINE_WARN_ONLY_BUNDLE_VERDICT ${verdict} ${relPath}`)
}

if (!softMode && verdict !== 'pass') process.exit(1)
