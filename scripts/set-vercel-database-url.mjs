#!/usr/bin/env node
/**
 * Update Vercel production DATABASE_URL and trigger a redeploy.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL='postgresql://...'
 *   $env:VERCEL_TOKEN='...'   # or rely on .env.local
 *   node scripts/set-vercel-database-url.mjs
 *
 * Optional:
 *   DATABASE_DIRECT_URL=...
 *   VERCEL_ORG_ID=team_...
 *   VERCEL_PROJECT_ID=prj_...
 *   SKIP_REDEPLOY=1
 */
import dotenv from 'dotenv'
import { readFileSync, existsSync } from 'node:fs'

for (const f of ['.env.local', '.env']) {
  if (existsSync(f)) dotenv.config({ path: f, override: false })
}

const token = process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId =
  process.env.VERCEL_PROJECT_ID ||
  process.env.VERCEL_DASHBOARD_PROJECT_ID ||
  'prj_bJ5BclTw72V6QFlsmGtR6BLTqqdx'
const databaseUrl = process.env.DATABASE_URL?.trim()
const directUrl = process.env.DATABASE_DIRECT_URL?.trim()

if (!token) {
  console.error('Missing VERCEL_TOKEN / VERCEL_ACCESS_TOKEN')
  process.exit(1)
}
if (!databaseUrl) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

function summarize(url) {
  try {
    const u = new URL(url.replace(/^postgresql:/, 'http:'))
    return { host: u.hostname, userHasProjectRef: u.username.includes('.'), port: u.port || '5432' }
  } catch {
    return { host: 'unparseable', userHasProjectRef: false, port: '?' }
  }
}

console.log('target', summarize(databaseUrl))

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

async function upsertEnv(key, value, targets = ['production']) {
  const listRes = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${teamId}`,
    { headers },
  )
  const listJson = await listRes.json()
  if (!listRes.ok) {
    throw new Error(`list env failed: ${listRes.status} ${JSON.stringify(listJson)}`)
  }
  const existing = (listJson.envs || []).find(
    (e) => e.key === key && (e.target || []).some((t) => targets.includes(t)),
  )

  if (existing?.id) {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}?teamId=${teamId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ value, type: 'encrypted', target: targets }),
      },
    )
    const json = await res.json()
    if (!res.ok) throw new Error(`patch ${key} failed: ${res.status} ${JSON.stringify(json)}`)
    console.log('updated', key, 'id', existing.id)
    return
  }

  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: targets,
      }),
    },
  )
  const json = await res.json()
  if (!res.ok) throw new Error(`create ${key} failed: ${res.status} ${JSON.stringify(json)}`)
  console.log('created', key)
}

await upsertEnv('DATABASE_URL', databaseUrl, ['production'])
if (directUrl) {
  await upsertEnv('DATABASE_DIRECT_URL', directUrl, ['production'])
}

if (process.env.SKIP_REDEPLOY === '1') {
  console.log('SKIP_REDEPLOY=1 — env updated only')
  process.exit(0)
}

const deployRes = await fetch(
  `https://api.vercel.com/v13/deployments?teamId=${teamId}&forceNew=1`,
  {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'payaid-v3',
      project: projectId,
      target: 'production',
      gitSource: {
        type: 'github',
        org: 'PayAidPayments',
        repo: 'PayAid-V3',
        ref: 'main',
      },
    }),
  },
)
const deployJson = await deployRes.json()
if (!deployRes.ok) {
  console.error('redeploy failed', deployRes.status, JSON.stringify(deployJson).slice(0, 400))
  console.log('Env was updated. Trigger a production redeploy from the Vercel dashboard if needed.')
  process.exit(2)
}
console.log(
  JSON.stringify({
    redeploy: true,
    id: deployJson.id || deployJson.uid,
    url: deployJson.url,
    status: deployRes.status,
  }),
)
