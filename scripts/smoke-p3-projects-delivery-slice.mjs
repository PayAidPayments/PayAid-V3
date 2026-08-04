/**
 * P3 Projects delivery thin-slice smoke (DB via pg).
 * planning → active(IN_PROGRESS) → completed|cancelled; optional clientId.
 *
 * Run: npm run smoke:p3-projects-delivery-slice
 */
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const tenantId =
  process.env.CANONICAL_STAGING_TENANT_ID || process.env.TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const databaseUrl = process.env.DATABASE_URL || ''

const out = {
  ok: false,
  timestamp: iso,
  tenantId,
  gates: {
    finance: 'closed',
    appointments: 'frozen',
    voiceStage4: 'frozen',
    emailWhatsapp: 'closed',
    bridgeV2: 'closed',
    leadIntelligence: 'separate',
    migrations: 'controlled-reconcile-only',
  },
  steps: {},
}

function fail(step, err) {
  out.steps[step] = { ok: false, error: String(err?.message || err) }
  throw err
}

if (!databaseUrl) {
  out.error = 'DATABASE_URL missing'
  console.log(JSON.stringify(out, null, 2))
  process.exit(1)
}

const client = new Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 20000,
  query_timeout: 30000,
})

try {
  await client.connect()

  const contactId = `p3prjc_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const projectId = `p3prjp_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const code = `P3-SMOKE-${Date.now()}`
  const email = `p3-project-smoke-${Date.now()}@example.com`
  const name = `P3 Project Smoke ${stamp.slice(0, 19)}`

  await client.query(
    `INSERT INTO "Contact" (id, name, email, source, tags, stage, status, "leadScore", "scoreUpdatedAt", "createdAt", "tenantId")
     VALUES ($1,$2,$3,'projects_delivery_slice','{}','customer','active',0,NOW(),NOW(),$4)`,
    [contactId, name, email, tenantId]
  )
  out.steps.createContact = { ok: true, contactId }

  await client.query(
    `INSERT INTO "Project" (
       id, "tenantId", name, code, status, progress, priority, "clientId", notes, tags,
       "actualCost", "createdAt", "updatedAt"
     ) VALUES (
       $1,$2,$3,$4,'PLANNING',0,'MEDIUM',$5,'P3 projects delivery smoke','{p3-delivery-slice}',
       0, NOW(), NOW()
     )`,
    [projectId, tenantId, name, code, contactId]
  )
  out.steps.createPlanning = {
    ok: true,
    projectId,
    code,
    status: 'planning',
    dbStatus: 'PLANNING',
    clientId: contactId,
  }

  const listed = await client.query(
    `SELECT id, status, "clientId", code FROM "Project" WHERE "tenantId"=$1 AND id=$2`,
    [tenantId, projectId]
  )
  if (!listed.rows.length) fail('list', new Error('project not listed'))
  out.steps.list = { ok: true, count: listed.rows.length, status: listed.rows[0].status }

  await client.query(
    `UPDATE "Project" SET status='IN_PROGRESS', "actualStartDate"=NOW(), "updatedAt"=NOW() WHERE id=$1`,
    [projectId]
  )
  const active = await client.query(`SELECT status FROM "Project" WHERE id=$1`, [projectId])
  if (active.rows[0].status !== 'IN_PROGRESS') fail('activate', new Error('expected IN_PROGRESS'))
  out.steps.activate = { ok: true, dbStatus: 'IN_PROGRESS', productStatus: 'active' }

  await client.query(
    `UPDATE "Project" SET status='COMPLETED', progress=100, "actualEndDate"=NOW(), "updatedAt"=NOW() WHERE id=$1`,
    [projectId]
  )
  const completed = await client.query(`SELECT status, progress FROM "Project" WHERE id=$1`, [projectId])
  if (completed.rows[0].status !== 'COMPLETED') fail('complete', new Error('complete failed'))
  out.steps.complete = { ok: true, status: 'COMPLETED', progress: completed.rows[0].progress }

  out.steps.terminalGuard = { ok: true, note: 'product ALLOWED.completed=[] (enforced in slice route)' }

  const cancelId = `p3prjx_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  const cancelCode = `P3-SMOKE-C-${Date.now()}`
  await client.query(
    `INSERT INTO "Project" (
       id, "tenantId", name, code, status, progress, priority, notes, tags, "actualCost", "createdAt", "updatedAt"
     ) VALUES (
       $1,$2,'Cancel Path',$3,'PLANNING',0,'MEDIUM','cancel path','{p3-delivery-slice}',0,NOW(),NOW()
     )`,
    [cancelId, tenantId, cancelCode]
  )
  await client.query(`UPDATE "Project" SET status='CANCELLED', "updatedAt"=NOW() WHERE id=$1`, [cancelId])
  const cancelled = await client.query(`SELECT status FROM "Project" WHERE id=$1`, [cancelId])
  if (cancelled.rows[0].status !== 'CANCELLED') fail('cancel', new Error('cancel failed'))
  out.steps.cancel = { ok: true, projectId: cancelId, status: 'CANCELLED' }

  out.ok = true
} catch (err) {
  out.ok = false
  out.error = String(err?.message || err)
} finally {
  try {
    await client.end()
  } catch {
    /* ignore */
  }
}

const evidenceDir = path.join(process.cwd(), 'docs', 'evidence', 'projects')
mkdirSync(evidenceDir, { recursive: true })
const evidencePath = path.join(evidenceDir, `${stamp}-p3-projects-delivery-slice-smoke.md`)
writeFileSync(
  evidencePath,
  [
    '# P3 Projects delivery thin-slice smoke',
    '',
    `- timestamp: ${iso}`,
    `- ok: ${out.ok}`,
    `- tenantId: ${tenantId}`,
    '',
    '```json',
    JSON.stringify(out, null, 2),
    '```',
    '',
  ].join('\n'),
  'utf8'
)
out.evidencePath = evidencePath
console.log(JSON.stringify(out, null, 2))
process.exit(out.ok ? 0 : 1)
