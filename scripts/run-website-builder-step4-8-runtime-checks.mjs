import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const now = new Date()
const isoNow = now.toISOString()
const stamp = isoNow.replace(/[:.]/g, '-')

const BASE_URL = process.env.WEBSITE_BUILDER_BASE_URL || ''
const AUTH_TOKEN = process.env.WEBSITE_BUILDER_AUTH_TOKEN || ''
const QA_TEMPLATE_REL = 'docs/evidence/closure/2026-04-24-website-builder-step4-8-runtime-qa-template.md'

function headers(withJson = false) {
  const out = {}
  if (AUTH_TOKEN) out.Authorization = `Bearer ${AUTH_TOKEN}`
  if (withJson) out['Content-Type'] = 'application/json'
  return out
}

async function requestJson(url, init = {}) {
  const res = await fetch(url, init)
  const body = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, body }
}

function normalizeLabel(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function discoverabilityEvidenceGate() {
  const templatePath = path.join(process.cwd(), QA_TEMPLATE_REL)
  if (!existsSync(templatePath)) {
    return {
      pass: false,
      details: { reason: `missing template: ${QA_TEMPLATE_REL}` },
    }
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

  const missing = []
  if (!started || started === 'Yes/No') missing.push('started-from-module')
  if (!visible || visible === 'Yes/No') missing.push('switcher-visible')
  if (!landed || landed === 'Yes/No') missing.push('navigation-landing')
  if (!passFail || passFail === 'PASS / FAIL') missing.push('pass/fail')
  if (!evidence) missing.push('evidence-link')

  return {
    pass: missing.length === 0,
    details:
      missing.length === 0
        ? { source: QA_TEMPLATE_REL, status: 'filled' }
        : { source: QA_TEMPLATE_REL, status: 'incomplete', missingFields: missing },
  }
}

async function run() {
  const discoverabilityGate = discoverabilityEvidenceGate()
  const blockedReasons = []
  if (!BASE_URL) blockedReasons.push('WEBSITE_BUILDER_BASE_URL is missing')
  if (!AUTH_TOKEN) blockedReasons.push('WEBSITE_BUILDER_AUTH_TOKEN is missing')
  if (blockedReasons.length > 0) {
    return {
      mode: 'blocked',
      blockedReasons,
      checks: [
        {
          id: 'G',
          endpoint: 'QA template discoverability evidence gate',
          pass: discoverabilityGate.pass,
          status: discoverabilityGate.pass ? 200 : 422,
          details: discoverabilityGate.details,
        },
      ],
    }
  }

  const checks = []
  const unique = normalizeLabel(`wb-step4-8-${Date.now()}`)

  const listInitial = await requestJson(`${BASE_URL}/api/website/sites`, { headers: headers() })
  checks.push({
    id: 'A',
    endpoint: 'GET /api/website/sites',
    pass: listInitial.status === 200 && Array.isArray(listInitial.body?.sites),
    status: listInitial.status,
    details: {
      sitesCount: Array.isArray(listInitial.body?.sites) ? listInitial.body.sites.length : null,
    },
  })

  const createPayload = {
    name: `WB Runtime ${unique}`,
    slug: `wb-runtime-${unique}`,
    goalType: 'lead_generation',
  }
  const created = await requestJson(`${BASE_URL}/api/website/sites`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify(createPayload),
  })
  const siteId = created.body?.id
  checks.push({
    id: 'B',
    endpoint: 'POST /api/website/sites',
    pass: created.status === 201 && typeof siteId === 'string' && siteId.length > 0,
    status: created.status,
    details: { siteId: siteId ?? null },
  })

  const siteDetail = siteId
    ? await requestJson(`${BASE_URL}/api/website/sites/${siteId}`, { headers: headers() })
    : { status: 0, ok: false, body: { error: 'missing siteId from create step' } }
  checks.push({
    id: 'C',
    endpoint: 'GET /api/website/sites/:id',
    pass: siteDetail.status === 200 && siteDetail.body?.id === siteId,
    status: siteDetail.status,
  })

  const metadataPatch = siteId
    ? await requestJson(`${BASE_URL}/api/website/sites/${siteId}`, {
        method: 'PATCH',
        headers: headers(true),
        body: JSON.stringify({
          name: `${createPayload.name} Updated`,
          goalType: 'service_showcase',
        }),
      })
    : { status: 0, ok: false, body: { error: 'missing siteId from create step' } }
  checks.push({
    id: 'D',
    endpoint: 'PATCH /api/website/sites/:id (metadata-only)',
    pass: metadataPatch.status === 200 && metadataPatch.body?.normalizedPageTree === false,
    status: metadataPatch.status,
    details: { normalizedPageTree: metadataPatch.body?.normalizedPageTree },
  })

  const pageTreePatch = siteId
    ? await requestJson(`${BASE_URL}/api/website/sites/${siteId}`, {
        method: 'PATCH',
        headers: headers(true),
        body: JSON.stringify({
          pageTree: [
            { title: 'Home', slug: 'home', pageType: 'home' },
            { title: 'About', slug: 'ABOUT', pageType: 'about' },
          ],
        }),
      })
    : { status: 0, ok: false, body: { error: 'missing siteId from create step' } }
  checks.push({
    id: 'E',
    endpoint: 'PATCH /api/website/sites/:id (pageTree)',
    pass: pageTreePatch.status === 200 && pageTreePatch.body?.normalizedPageTree === true,
    status: pageTreePatch.status,
    details: { normalizedPageTree: pageTreePatch.body?.normalizedPageTree },
  })

  const generateDraft = await requestJson(`${BASE_URL}/api/website/ai/generate-draft`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({
      siteId,
      businessProfile: {
        businessName: createPayload.name,
        industry: 'general_business',
        productsOrServices: [],
      },
      websiteGoal: 'lead_generation',
      pages: ['Home', 'About', 'Services', 'Contact'],
      brand: {},
    }),
  })
  checks.push({
    id: 'F',
    endpoint: 'POST /api/website/ai/generate-draft',
    pass: generateDraft.status === 200 && Array.isArray(generateDraft.body?.draft?.pagePlan),
    status: generateDraft.status,
    details: {
      pagePlanCount: Array.isArray(generateDraft.body?.draft?.pagePlan)
        ? generateDraft.body.draft.pagePlan.length
        : null,
    },
  })

  checks.push({
    id: 'G',
    endpoint: 'QA template discoverability evidence gate',
    pass: discoverabilityGate.pass,
    status: discoverabilityGate.pass ? 200 : 422,
    details: discoverabilityGate.details,
  })

  const overallOk = checks.every((check) => check.pass)
  return { mode: 'executed', overallOk, checks, baseUrl: BASE_URL, createdSiteId: siteId ?? null }
}

const result = await run()
const outDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
mkdirSync(outDir, { recursive: true })
const jsonPath = path.join(outDir, `${stamp}-website-builder-step4-8-runtime-checks.json`)
const mdPath = path.join(outDir, `${stamp}-website-builder-step4-8-runtime-checks.md`)

const payload = {
  check: 'website-builder-step4-8-runtime-checks',
  timestamp: isoNow,
  ...result,
}
writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const lines = []
lines.push('# Website Builder Step 4.8 runtime checks')
lines.push('')
lines.push(`- Timestamp: ${isoNow}`)
lines.push(`- Mode: ${result.mode}`)
if ('overallOk' in result) lines.push(`- Overall: ${result.overallOk ? 'pass' : 'fail'}`)
if (result.mode === 'blocked') lines.push(`- Blockers: ${result.blockedReasons.join('; ')}`)
if ('createdSiteId' in result && result.createdSiteId) lines.push(`- Created site ID: ${result.createdSiteId}`)
lines.push(`- JSON artifact: \`${jsonPath}\``)
lines.push('')
lines.push('## Checks')
lines.push('')
for (const check of result.checks || []) {
  lines.push(`- ${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.endpoint} (status=${check.status})`)
}
lines.push('')
lines.push('## Raw payload')
lines.push('')
lines.push('```json')
lines.push(JSON.stringify(payload, null, 2))
lines.push('```')
lines.push('')
writeFileSync(mdPath, lines.join('\n'), 'utf8')

const overallOk = result.mode === 'executed' && result.overallOk === true
console.log(JSON.stringify({ overallOk, mode: result.mode, jsonPath, mdPath }, null, 2))
process.exitCode = overallOk ? 0 : 1
