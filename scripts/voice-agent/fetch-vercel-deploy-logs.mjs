#!/usr/bin/env node
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveVercelToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const rawId = process.argv[2] || 'dpl_iFwF5YCTxuLhBLbyBH3HMdpNr1KT'
const deploymentId = rawId.startsWith('dpl_') ? rawId : `dpl_${rawId}`
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const token = resolveVercelToken()
if (!token) {
  console.error('No Vercel token')
  process.exit(1)
}

const url = `https://api.vercel.com/v3/deployments/${deploymentId}/events?teamId=${teamId}&limit=200&direction=backward`
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
const body = await res.json()
if (!res.ok) {
  console.error(JSON.stringify(body, null, 2))
  process.exit(1)
}
const events = Array.isArray(body) ? body : body.events || []
const text = events
  .map((e) => e.payload?.text || e.text || '')
  .filter(Boolean)
  .reverse()
  .join('\n')

if (process.env.VERBOSE === '1') {
  console.log(JSON.stringify({ eventCount: events.length, sample: events.slice(0, 3) }, null, 2))
}
const typeErr = text.match(/Type error:[\s\S]{0,1200}/)
const fail = text.match(/Failed to compile[\s\S]{0,1200}/)
console.log(typeErr?.[0] || fail?.[0] || text.slice(-3000) || '(no log text)')
