#!/usr/bin/env node
/**
 * Poll Vercel API until the voice project has a READY production deployment (or timeout).
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readVercelCliToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_VOICE_PROJECT_ID || 'prj_vlDdR0KxmtdWXHGmjN1gI0EN952D'
const token = process.env.VERCEL_TOKEN?.trim() || readVercelCliToken()
const timeoutMs = Number(process.env.VERCEL_READY_TIMEOUT_MS || 20 * 60 * 1000)
const intervalMs = Number(process.env.VERCEL_READY_POLL_MS || 15000)

if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'Vercel token required' }, null, 2))
  process.exit(1)
}

const headers = { Authorization: `Bearer ${token}` }
const started = Date.now()

async function latestDeployments() {
  const u = new URL('https://api.vercel.com/v6/deployments')
  u.searchParams.set('teamId', teamId)
  u.searchParams.set('projectId', projectId)
  u.searchParams.set('limit', '5')
  const r = await fetch(u, { headers })
  const j = await r.json().catch(() => ({}))
  return j.deployments || []
}

while (Date.now() - started < timeoutMs) {
  const list = await latestDeployments()
  const ready = list.find((d) => d.readyState === 'READY')
  const building = list.find((d) => ['BUILDING', 'QUEUED', 'INITIALIZING'].includes(d.readyState))
  const latest = list[0]

  if (ready) {
    const url = `https://${ready.url}`
    console.log(
      JSON.stringify(
        { ok: true, readyState: 'READY', url, deploymentId: ready.uid, alias: ready.alias },
        null,
        2,
      ),
    )
    process.exit(0)
  }

  if (latest?.readyState === 'ERROR') {
    console.log(
      JSON.stringify(
        {
          ok: false,
          readyState: 'ERROR',
          url: latest.url ? `https://${latest.url}` : null,
          deploymentId: latest.uid,
          note: 'Latest deployment failed — check Vercel build logs',
        },
        null,
        2,
      ),
    )
    process.exit(1)
  }

  console.log(
    JSON.stringify(
      {
        waiting: true,
        latestState: latest?.readyState,
        latestUrl: latest?.url,
        building: building?.url,
        elapsedMs: Date.now() - started,
      },
      null,
      2,
    ),
  )
  await new Promise((r) => setTimeout(r, intervalMs))
}

console.error(JSON.stringify({ ok: false, error: 'timeout waiting for READY deployment' }, null, 2))
process.exit(1)
