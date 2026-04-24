import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

function resolveLatestRuntimeArtifact() {
  const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
  const files = readdirSync(closureDir).filter((name) => name.endsWith('-website-builder-step4-8-runtime-checks.json'))
  if (files.length === 0) {
    throw new Error('No Website Builder Step 4.8 runtime artifact found in docs/evidence/closure')
  }
  files.sort().reverse()
  return path.join('docs', 'evidence', 'closure', files[0]).replace(/\\/g, '/')
}

const INPUT_JSON = process.env.WEBSITE_BUILDER_STEP4_8_ARTIFACT_JSON || resolveLatestRuntimeArtifact()
const TARGET_MD =
  process.env.WEBSITE_BUILDER_STEP4_8_EVIDENCE_MD ||
  'docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md'

const inputPath = path.join(process.cwd(), INPUT_JSON)
const targetPath = path.join(process.cwd(), TARGET_MD)

const payload = JSON.parse(readFileSync(inputPath, 'utf8'))
let out = readFileSync(targetPath, 'utf8')

const checks = Array.isArray(payload.checks) ? payload.checks : []
const checksById = Object.fromEntries(checks.map((check) => [check.id, check]))

function stepResult(id) {
  const check = checksById[id]
  if (!check) return 'n/a'
  return `${check.pass ? 'pass' : 'fail'} (status=${check.status ?? 'n/a'})`
}

out = out.replace(/\*\*Date:\*\*.*\n/, `**Date:** ${payload.timestamp || '[timestamp missing]'}\n`)
out = out.replace(/\*\*Environment URL:\*\*.*\n/, `**Environment URL:** ${payload.baseUrl || '[missing]'}\n`)

const createdSiteId = payload.createdSiteId || checksById.B?.details?.siteId || '[not captured]'

out = out.replace(/### A\) `GET \/api\/website\/sites`[\s\S]*?### B\) `POST \/api\/website\/sites`/, `### A) \`GET /api/website/sites\`
- Status: ${checksById.A?.status ?? '[n/a]'}
- Notes (\`sites[]\` shape / errors): ${stepResult('A')}
- Pass/Fail: ${checksById.A?.pass ? 'Pass' : 'Fail'}

### B) \`POST /api/website/sites\``)

out = out.replace(/### B\) `POST \/api\/website\/sites`[\s\S]*?### C\) `GET \/api\/website\/sites\/:id`/, `### B) \`POST /api/website/sites\`
- Status: ${checksById.B?.status ?? '[n/a]'}
- Notes (\`201\` expected on valid payload): ${stepResult('B')} (siteId=${createdSiteId})
- Pass/Fail: ${checksById.B?.pass ? 'Pass' : 'Fail'}

### C) \`GET /api/website/sites/:id\``)

out = out.replace(/### C\) `GET \/api\/website\/sites\/:id`[\s\S]*?### D\) `PATCH \/api\/website\/sites\/:id` \(metadata only\)/, `### C) \`GET /api/website/sites/:id\`
- Status: ${checksById.C?.status ?? '[n/a]'}
- Notes (metadata + compatibility mode): ${stepResult('C')}
- Pass/Fail: ${checksById.C?.pass ? 'Pass' : 'Fail'}

### D) \`PATCH /api/website/sites/:id\` (metadata only)`)

out = out.replace(/### D\) `PATCH \/api\/website\/sites\/:id` \(metadata only\)[\s\S]*?### E\) `PATCH \/api\/website\/sites\/:id` \(with pageTree\)/, `### D) \`PATCH /api/website/sites/:id\` (metadata only)
- Status: ${checksById.D?.status ?? '[n/a]'}
- \`normalizedPageTree\` observed: ${checksById.D?.details?.normalizedPageTree ?? '[n/a]'}
- Pass/Fail: ${checksById.D?.pass ? 'Pass' : 'Fail'}

### E) \`PATCH /api/website/sites/:id\` (with pageTree)`)

out = out.replace(/### E\) `PATCH \/api\/website\/sites\/:id` \(with pageTree\)[\s\S]*?### F\) `POST \/api\/website\/ai\/generate-draft`/, `### E) \`PATCH /api/website/sites/:id\` (with pageTree)
- Status: ${checksById.E?.status ?? '[n/a]'}
- \`normalizedPageTree\` observed: ${checksById.E?.details?.normalizedPageTree ?? '[n/a]'}
- Invalid payload rejection check (\`400\` + \`details[]\`): [manual]
- Pass/Fail: ${checksById.E?.pass ? 'Pass' : 'Fail'}

### F) \`POST /api/website/ai/generate-draft\``)

out = out.replace(/### F\) `POST \/api\/website\/ai\/generate-draft`[\s\S]*?---/, `### F) \`POST /api/website/ai/generate-draft\`
- Status: ${checksById.F?.status ?? '[n/a]'}
- \`draft.pagePlan[]\` observed: ${
  typeof checksById.F?.details?.pagePlanCount === 'number' ? 'Yes' : 'No'
}
- Pass/Fail: ${checksById.F?.pass ? 'Pass' : 'Fail'}

---`)

const summaryHeader = '## Automation Summary'
const summaryBlock = [
  summaryHeader,
  '',
  `- Source artifact: \`${INPUT_JSON}\``,
  `- Mode: ${payload.mode || 'unknown'}`,
  `- Overall: ${
    typeof payload.overallOk === 'boolean' ? (payload.overallOk ? 'pass' : 'fail') : 'n/a (blocked)'
  }`,
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
