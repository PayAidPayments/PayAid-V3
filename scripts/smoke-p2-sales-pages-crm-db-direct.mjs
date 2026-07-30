/**
 * DB-direct P2 qualify smoke (no hosted deploy required).
 * Loads DATABASE_URL from .env.local / .env and runs bridge-v2 against a PUBLISHED page.
 *
 *   node --import tsx scripts/smoke-p2-sales-pages-crm-db-direct.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    if (process.env[m[1]]) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    process.env[m[1]] = v
  }
}

loadEnvFile(path.resolve('.env.local'))
loadEnvFile(path.resolve('.env'))

const out = { check: 'p2-sales-pages-crm-db-direct', pass: false, steps: {} }

if (!process.env.DATABASE_URL) {
  out.error = 'DATABASE_URL missing'
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const { prisma } = await import('../lib/db/prisma.ts')
const { processSalesPageSubmission, listSalesPageSubmissions } = await import(
  '../lib/sales-pages/landing-page-submission-bridge.ts'
)

try {
  const page = await prisma.landingPage.findFirst({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true, tenantId: true, name: true },
    orderBy: { updatedAt: 'desc' },
  })
  out.steps.page = page
  if (!page) {
    out.error = 'No PUBLISHED landing page'
    console.log(JSON.stringify(out, null, 2))
    process.exit(1)
  }

  const email = `p2-db-${Date.now()}@example.com`
  const result = await processSalesPageSubmission({
    salesPageId: page.id,
    formId: 'p2-db-direct',
    payload: { name: 'P2 DB Direct', email, phone: '+919777666555' },
    attribution: { source: 'p2-db-direct', medium: 'script', campaign: 'qualify-loop' },
    ctaEvent: { type: 'form_submit' },
  })
  out.steps.submit = {
    ok: result.ok,
    contactId: result.ok ? result.contactId : null,
    crmSyncStatus: result.ok ? result.entry.crmSyncStatus : null,
    entryId: result.ok ? result.entry.id : null,
    error: result.ok ? null : result.error,
  }

  if (!result.ok) {
    console.log(JSON.stringify(out, null, 2))
    process.exit(1)
  }

  const listed = await listSalesPageSubmissions(page.tenantId, { pageId: page.id, limit: 20 })
  const found = listed.find((row) => row.id === result.entry.id)
  out.steps.list = { count: listed.length, found: Boolean(found), status: found?.crmSyncStatus || null }

  out.pass =
    result.entry.crmSyncStatus === 'crm_synced' &&
    Boolean(result.contactId) &&
    Boolean(found)

  console.log(JSON.stringify(out, null, 2))
  process.exit(out.pass ? 0 : 1)
} finally {
  await prisma.$disconnect().catch(() => {})
}
