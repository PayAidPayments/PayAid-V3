import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const closureDir = path.join(ROOT, 'docs', 'evidence', 'closure')

function latestMatching(suffix) {
  if (!existsSync(closureDir)) return null
  const files = readdirSync(closureDir).filter((name) => name.endsWith(suffix))
  if (files.length === 0) return null
  files.sort().reverse()
  return path.join('docs', 'evidence', 'closure', files[0]).replace(/\\/g, '/')
}

function hasStep48InHandoff() {
  const handoffPath = path.join(ROOT, 'docs', 'VERCEL_PRODUCTION_TESTING_HANDOFF.md')
  if (!existsSync(handoffPath)) return false
  const body = readFileSync(handoffPath, 'utf8')
  return body.includes('## Step 4.8 - Website Builder MVP runtime verification')
}

function discoverabilityTemplateCheck() {
  const templateRel = 'docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md'
  const templatePath = path.join(ROOT, templateRel)
  if (!existsSync(templatePath)) {
    return { ok: false, detail: `missing template: ${templateRel}` }
  }

  const body = readFileSync(templatePath, 'utf8')
  const requiredMarkers = [
    '### 1) Module discoverability (switcher -> Website Builder)',
    '- Started from non-Website Builder module:',
    '- `Website Builder` visible in module switcher secondary tools:',
    '- Click navigation landed on `/website-builder/[tenantId]/Home` (direct or redirect):',
  ]

  const missing = requiredMarkers.filter((marker) => !body.includes(marker))
  if (missing.length > 0) {
    return {
      ok: false,
      detail: `missing discoverability markers: ${missing.join(' | ')}`,
    }
  }

  return { ok: true, detail: 'discoverability section present in QA template' }
}

function discoverabilityEvidenceFilledCheck() {
  const templateRel = 'docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md'
  const templatePath = path.join(ROOT, templateRel)
  if (!existsSync(templatePath)) {
    return { ok: false, detail: `missing template: ${templateRel}` }
  }

  const body = readFileSync(templatePath, 'utf8')
  const lines = body.split(/\r?\n/)

  function valueFor(prefix) {
    const line = lines.find((entry) => entry.trim().startsWith(prefix))
    if (!line) return null
    return line.slice(line.indexOf(prefix) + prefix.length).trim()
  }

  const started = valueFor('- Started from non-Website Builder module:')
  const visible = valueFor('- `Website Builder` visible in module switcher secondary tools:')
  const landed = valueFor('- Click navigation landed on `/website-builder/[tenantId]/Home` (direct or redirect):')
  const passFail = valueFor('- Pass/Fail:')
  const evidence = valueFor('- Evidence (screenshot/video):')

  const problems = []
  if (!started || started === 'Yes/No') problems.push('started-from-module not filled')
  if (!visible || visible === 'Yes/No') problems.push('switcher-visible not filled')
  if (!landed || landed === 'Yes/No') problems.push('navigation-landing not filled')
  if (!passFail || passFail === 'PASS / FAIL') problems.push('pass/fail not filled')
  if (!evidence) problems.push('evidence link/path missing')

  if (problems.length > 0) {
    return { ok: false, detail: `discoverability evidence incomplete: ${problems.join(' | ')}` }
  }

  return { ok: true, detail: 'discoverability evidence fields populated in QA template' }
}

const requiredDocs = [
  'docs/WEBSITE_BUILDER_READY_TO_COMMIT_CHECKLIST.md',
  'docs/WEBSITE_BUILDER_STEP4_8_RUNTIME_RUNBOOK.md',
  'docs/WEBSITE_BUILDER_STEP4_8_ENV_TEMPLATE.md',
  'docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md',
]

const docChecks = requiredDocs.map((rel) => ({
  file: rel,
  exists: existsSync(path.join(ROOT, rel)),
}))

const latestJson = latestMatching('-website-builder-step4-8-runtime-checks.json')
const latestMd = latestMatching('-website-builder-step4-8-runtime-checks.md')

const checks = [
  ...docChecks.map((item) => ({
    id: `doc:${item.file}`,
    ok: item.exists,
    detail: item.exists ? 'present' : 'missing',
  })),
  {
    id: 'handoff:step4.8',
    ok: hasStep48InHandoff(),
    detail: hasStep48InHandoff() ? 'present' : 'missing step section',
  },
  {
    id: 'template:discoverability',
    ...discoverabilityTemplateCheck(),
  },
  {
    id: 'template:discoverability-evidence',
    ...discoverabilityEvidenceFilledCheck(),
  },
  {
    id: 'artifact:runtime-json',
    ok: Boolean(latestJson),
    detail: latestJson || 'missing',
  },
  {
    id: 'artifact:runtime-md',
    ok: Boolean(latestMd),
    detail: latestMd || 'missing',
  },
]

const overallOk = checks.every((check) => check.ok)
const timestamp = new Date().toISOString()
const stamp = timestamp.replace(/[:.]/g, '-')
const summary = {
  check: 'website-builder-ready-to-commit',
  timestamp,
  overallOk,
  checks,
  recommendation: overallOk
    ? 'Ready-to-commit checks passed.'
    : 'Fix missing checks before commit/PR handoff.',
}

mkdirSync(closureDir, { recursive: true })
const jsonPath = path.join(closureDir, `${stamp}-website-builder-ready-to-commit-check.json`)
const mdPath = path.join(closureDir, `${stamp}-website-builder-ready-to-commit-check.md`)

writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Website Builder ready-to-commit check')
lines.push('')
lines.push(`- Timestamp: ${summary.timestamp}`)
lines.push(`- Overall: ${summary.overallOk ? 'pass' : 'fail'}`)
lines.push(`- Recommendation: ${summary.recommendation}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Checks')
lines.push('')
for (const check of checks) {
  lines.push(`- ${check.ok ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`)
}
lines.push('')
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(summary, null, 2))
lines.push('```')
lines.push('')
writeFileSync(mdPath, lines.join('\n'), 'utf8')

console.log(
  JSON.stringify(
    {
      ...summary,
      jsonPath,
      mdPath,
    },
    null,
    2
  )
)
process.exitCode = overallOk ? 0 : 1
