#!/usr/bin/env node
/**
 * Resolve voice project production URL, READY deployments, and protection bypass secret.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readVercelCliToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const token = process.env.VERCEL_TOKEN || readVercelCliToken() || process.env.VERCEL_OIDC_TOKEN || ''
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectName = process.env.VERCEL_VOICE_PROJECT || 'voice'
const projectIdFallback = process.env.VERCEL_VOICE_PROJECT_ID || 'prj_vlDdR0KxmtdWXHGmjN1gI0EN952D'

if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN required' }, null, 2))
  process.exit(1)
}

const headers = { Authorization: `Bearer ${token}` }

async function findVoiceProject() {
  const direct = new URL(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}`)
  direct.searchParams.set('teamId', teamId)
  let res = await fetch(direct, { headers })
  let body = await res.json().catch(() => ({}))
  if (res.ok && body?.id) return body

  const list = new URL('https://api.vercel.com/v9/projects')
  list.searchParams.set('teamId', teamId)
  list.searchParams.set('limit', '100')
  res = await fetch(list, { headers })
  body = await res.json().catch(() => ({}))
  const projects = body.projects || []
  return projects.find((p) => p.name === projectName || p.id?.includes('voice'))
}

async function listDeployments(projectId) {
  const url = new URL('https://api.vercel.com/v6/deployments')
  url.searchParams.set('teamId', teamId)
  url.searchParams.set('projectId', projectId)
  url.searchParams.set('limit', '20')
  const res = await fetch(url, { headers })
  const body = await res.json().catch(() => ({}))
  return body.deployments || []
}

function extractProjectBypass(project) {
  const pb = project?.protectionBypass
  if (!pb) return null
  if (typeof pb === 'string' && pb.length > 8) return pb
  if (typeof pb === 'object') {
    const secret = pb.secret || pb.value
    if (secret) return String(secret)
    const keys = Object.keys(pb)
    if (keys.length === 1 && keys[0].length >= 16) return keys[0]
  }
  return null
}

async function getBypass(projectId, project) {
  const fromProject = extractProjectBypass(project)
  if (fromProject) return { ok: true, secret: fromProject, source: 'project' }
  const paths = [
    `https://api.vercel.com/v1/projects/${projectId}/protection-bypass`,
    `https://api.vercel.com/v1/projects/${projectId}/protection-bypass/automation-bypass`,
  ]
  for (const p of paths) {
    const url = new URL(p)
    url.searchParams.set('teamId', teamId)
    const res = await fetch(url, { headers })
    const body = await res.json().catch(() => ({}))
    if (res.ok) {
      const secret =
        body?.protectionBypass?.secret ||
        body?.secret ||
        body?.value ||
        (typeof body === 'string' ? body : null)
      if (secret) return { ok: true, secret, source: p }
    }
  }
  return { ok: false }
}

let project = await findVoiceProject()
if (!project?.id && projectIdFallback) {
  const byId = new URL(`https://api.vercel.com/v9/projects/${projectIdFallback}`)
  byId.searchParams.set('teamId', teamId)
  const res = await fetch(byId, { headers })
  const body = await res.json().catch(() => ({}))
  if (res.ok && body?.id) project = body
}
if (!project?.id) {
  console.error(
    JSON.stringify(
      { ok: false, error: 'voice project not found', hint: 'link apps/voice with npx vercel link' },
      null,
      2,
    ),
  )
  process.exit(1)
}

const deployments = await listDeployments(project.id)
const ready = deployments.filter((d) => d.readyState === 'READY')
const production = ready.find((d) => d.target === 'production') || ready[0]
const latestAny = deployments[0]
const bypass = await getBypass(project.id, project)

const baseUrl = (d) => {
  if (!d) return null
  const host = d.url || (Array.isArray(d.alias) ? d.alias[0] : null)
  return host ? (host.startsWith('http') ? host : `https://${host}`) : null
}

const recommendedBaseUrl = baseUrl(production) || baseUrl(ready[0]) || null

const out = {
  ok: true,
  projectId: project.id,
  projectName: project.name,
  productionUrl: baseUrl(production) || project?.targets?.production?.url || null,
  latestReadyUrl: baseUrl(ready[0]),
  latestDeploymentUrl: baseUrl(latestAny),
  recommendedBaseUrl,
  readyDeployments: ready.slice(0, 5).map((d) => ({ url: baseUrl(d), state: d.readyState, target: d.target })),
  protectionBypassPresent: Boolean(bypass.secret),
}

console.log(JSON.stringify(out, null, 2))
if (bypass.secret) {
  console.log('\n# Add to .env.local (do not commit):')
  console.log(`VERCEL_PROTECTION_BYPASS=${bypass.secret}`)
  const host =
    out.productionUrl || out.latestReadyUrl || out.latestDeploymentUrl || ''
  console.log(`BASE_URL=${host}`)
}
