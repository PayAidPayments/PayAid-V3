import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

function resolveLatestRuntimeArtifact() {
  const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
  const files = readdirSync(closureDir).filter((name) => name.endsWith('-canonical-staging-runtime-checks.json'))
  if (files.length === 0) {
    throw new Error('No canonical staging runtime artifact found in docs/evidence/closure')
  }
  files.sort().reverse()
  return path.join('docs', 'evidence', 'closure', files[0]).replace(/\\/g, '/')
}

const INPUT_JSON = process.env.CANONICAL_STAGING_ARTIFACT_JSON || resolveLatestRuntimeArtifact()
const TARGET_MD =
  process.env.CANONICAL_STAGING_EVIDENCE_MD ||
  'docs/evidence/closure/2026-04-23-canonical-staging-runtime-evidence.md'

function rowForBlocked(checkId, reasons) {
  return `| ${checkId} | \`${
    {
      S1: 'GET /api/modules',
      S2: 'GET /api/industries/[industry]/modules',
      S3: 'POST /api/industries/[industry]/modules',
      S4: 'POST /api/industries/custom/modules',
      S5: 'POST /api/ai/analyze-industry',
    }[checkId]
  }\` | [blocked] | [blocked] | blocked (no runtime response) | Blocked | ${reasons.join('; ')} |`
}

function rowForCheck(check) {
  const keys = Array.isArray(check.keys) ? check.keys.join(', ') : '[no keys]'
  const status = check.status ?? 'n/a'
  const passFail = check.pass ? 'Pass' : 'Fail'
  const notes = `status=${status}`
  const endpointMap = {
    S1: 'GET /api/modules',
    S2: 'GET /api/industries/[industry]/modules',
    S3: 'POST /api/industries/[industry]/modules',
    S4: 'POST /api/industries/custom/modules',
    S5: 'POST /api/ai/analyze-industry',
  }
  return `| ${check.id} | \`${endpointMap[check.id]}\` | [see expected column] | [see expected column] | ${keys} | ${passFail} | ${notes} |`
}

const inputPath = path.join(process.cwd(), INPUT_JSON)
const targetPath = path.join(process.cwd(), TARGET_MD)

const payload = JSON.parse(readFileSync(inputPath, 'utf8'))
let out = readFileSync(targetPath, 'utf8')

// Update metadata rows
out = out.replace(
  /\| Base URL \| .* \|/,
  `| Base URL | ${payload.baseUrl && payload.baseUrl !== '[missing]' ? payload.baseUrl : '[missing]'} |`
)

if (out.includes('| Automation artifact |')) {
  out = out.replace(/\| Automation artifact \| .* \|/, `| Automation artifact | \`${INPUT_JSON}\` |`)
} else {
  out = out.replace(
    /\| Evidence output path \| .* \|/,
    (line) => `${line}\n| Automation artifact | \`${INPUT_JSON}\` |`
  )
}

// Replace S1-S5 rows
const blockedReasons = Array.isArray(payload.blockedReasons) ? payload.blockedReasons : []
const checks = Array.isArray(payload.checks) ? payload.checks : []
const checksById = Object.fromEntries(checks.map((c) => [c.id, c]))

for (const id of ['S1', 'S2', 'S3', 'S4', 'S5']) {
  const rowRegex = new RegExp(`\\| ${id} \\|[^\\n]*`, 'g')
  const replacement =
    payload.mode === 'blocked' ? rowForBlocked(id, blockedReasons) : rowForCheck(checksById[id] || { id, pass: false })
  out = out.replace(rowRegex, replacement)
}

// Append automation summary block (idempotent replace)
const summaryHeader = '## Automation Summary'
const summaryBlock = [
  summaryHeader,
  '',
  `- Source artifact: \`${INPUT_JSON}\``,
  `- Mode: ${payload.mode || 'unknown'}`,
  `- Overall: ${
    typeof payload.overallOk === 'boolean' ? (payload.overallOk ? 'pass' : 'fail') : 'n/a (blocked)'
  }`,
  payload.mode === 'blocked' && blockedReasons.length
    ? `- Blocked reasons: ${blockedReasons.join('; ')}`
    : '- Blocked reasons: none',
  '',
].join('\n')

if (out.includes(summaryHeader)) {
  out = out.replace(new RegExp(`${summaryHeader}[\\s\\S]*$`), summaryBlock)
} else {
  out = `${out.trimEnd()}\n\n${summaryBlock}\n`
}

writeFileSync(targetPath, out, 'utf8')
console.log(
  JSON.stringify(
    {
      updated: true,
      inputArtifact: INPUT_JSON,
      targetEvidence: TARGET_MD,
      mode: payload.mode || 'unknown',
    },
    null,
    2
  )
)
