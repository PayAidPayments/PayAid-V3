#!/usr/bin/env node
/**
 * Prepare Voice/Bolna Stage 1 live validation: migrations, env discovery, route probe.
 * Does not change product routes or tool/KB/event logic.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ quiet: true })

const root = process.cwd()
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = path.join(root, 'docs', 'evidence', 'voice-agent')
mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `${stamp}-stage1-live-validation-prep.md`)

function mask(v) {
  if (!v) return '[unset]'
  if (v.length <= 8) return '********'
  return `${v.slice(0, 4)}…${v.slice(-4)} (${v.length} chars)`
}

async function columnExists(prisma, table, column) {
  const rows = await prisma.$queryRaw`
    SELECT 1 AS ok
    FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column}
    LIMIT 1
  `
  return Array.isArray(rows) && rows.length > 0
}

async function probeRoutes(baseUrl) {
  const base = baseUrl.replace(/\/$/, '')
  const probes = [
    {
      name: 'tools_execute',
      method: 'POST',
      path: '/api/v1/voice-agents/runtime/bolna/tools/execute',
      body: '{}',
    },
    {
      name: 'kb_search',
      method: 'POST',
      path: '/api/v1/voice-agents/runtime/bolna/kb/search',
      body: '{}',
    },
    {
      name: 'events',
      method: 'POST',
      path: '/api/v1/voice-agents/runtime/bolna/events',
      body: '{}',
    },
    {
      name: 'analytics',
      method: 'GET',
      path: '/api/v1/voice-agents/analytics?period=today',
    },
  ]

  const results = []
  for (const p of probes) {
    const started = Date.now()
    try {
      const res = await fetch(`${base}${p.path}`, {
        method: p.method,
        headers: p.body ? { 'Content-Type': 'application/json' } : { Accept: 'application/json' },
        body: p.body,
        signal: AbortSignal.timeout(25000),
      })
      const ct = res.headers.get('content-type') || ''
      const isHtml404 = res.status === 404 && ct.includes('text/html')
      results.push({
        name: p.name,
        status: res.status,
        ms: Date.now() - started,
        routeExists: !isHtml404 && res.status !== 404,
        note: isHtml404 ? 'dashboard/host 404 HTML' : res.status === 401 || res.status === 403 ? 'route reachable (auth gate)' : res.status === 400 ? 'route reachable (validation)' : `http ${res.status}`,
      })
    } catch (e) {
      results.push({
        name: p.name,
        status: null,
        ms: Date.now() - started,
        routeExists: false,
        note: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return results
}

const lines = []
lines.push('# Stage 1 live validation prep')
lines.push('')
lines.push(`- Timestamp: ${new Date().toISOString()}`)
lines.push('')

// 1) Migration (scoped SQL — full migrate deploy may be blocked on unrelated pending migrations)
lines.push('## 1) Voice runtime migration')
const applyVoice = spawnSync('node', ['scripts/voice-agent/apply-voice-runtime-migration.mjs'], {
  cwd: root,
  encoding: 'utf8',
  env: process.env,
})
lines.push(`- apply-voice-runtime-migration exit: ${applyVoice.status ?? 'ERR'}`)
if (applyVoice.stdout) lines.push('```', applyVoice.stdout.trim(), '```')
if (applyVoice.stderr) lines.push('```', applyVoice.stderr.trim().slice(-800), '```')

const prisma = new PrismaClient()
let migrationOk = false
try {
  const cols = await Promise.all([
    columnExists(prisma, 'VoiceAgentCall', 'firstAudioMs'),
    columnExists(prisma, 'VoiceAgentCall', 'bargeInCount'),
    columnExists(prisma, 'VoiceAgent', 'voiceRuntime'),
  ])
  migrationOk = cols.every(Boolean)
  lines.push(`- VoiceAgentCall.firstAudioMs: ${cols[0] ? 'present' : 'MISSING'}`)
  lines.push(`- VoiceAgentCall.bargeInCount: ${cols[1] ? 'present' : 'MISSING'}`)
  lines.push(`- VoiceAgent.voiceRuntime: ${cols[2] ? 'present' : 'MISSING'}`)
  lines.push(`- **Migrations applied:** ${migrationOk ? 'YES' : 'NO'}`)
} finally {
  await prisma.$disconnect()
}

// 2) Env discovery
lines.push('')
lines.push('## 2) Validation env')
const bridgeSecret = process.env.BOLNA_BRIDGE_SECRET
const tenantId =
  process.env.TENANT_ID || process.env.PERF_TENANT_ID || process.env.DEFAULT_TENANT_ID || ''
const agentId = process.env.VOICE_AGENT_BOLNA_SMOKE_AGENT_ID || ''
const authToken = process.env.AUTH_TOKEN || process.env.API_AUTH_TOKEN || ''

lines.push(`- BOLNA_BRIDGE_SECRET: ${mask(bridgeSecret)}`)
lines.push(`- TENANT_ID: ${tenantId || '[unset]'}`)
lines.push(`- VOICE_AGENT_BOLNA_SMOKE_AGENT_ID: ${agentId || '[unset]'}`)
lines.push(`- AUTH_TOKEN: ${authToken ? mask(authToken) : '[unset]'}`)

if (!tenantId || !agentId) {
  const p2 = new PrismaClient()
  try {
    const tenant = await p2.tenant.findFirst({
      where: { status: 'active', licensedModules: { has: 'ai-studio' } },
      select: { id: true, name: true },
      orderBy: { updatedAt: 'desc' },
    })
    if (tenant) {
      lines.push(`- Suggested TENANT_ID: \`${tenant.id}\` (${tenant.name})`)
      const agents = await p2.$queryRaw`
        SELECT id, name FROM "VoiceAgent"
        WHERE "tenantId" = ${tenant.id} AND status <> 'deleted'
        ORDER BY "updatedAt" DESC LIMIT 5
      `
      if (Array.isArray(agents) && agents.length) {
        for (const a of agents) {
          lines.push(`  - agent: \`${a.id}\` (${a.name})`)
        }
        lines.push(`- Suggested VOICE_AGENT_BOLNA_SMOKE_AGENT_ID: \`${agents[0].id}\``)
      } else {
        lines.push('- No VoiceAgent rows for suggested tenant (create one before smoke).')
      }
    }
  } finally {
    await p2.$disconnect()
  }
}

// 3) Route probe
lines.push('')
lines.push('## 3) Deployed route probe')
const baseUrl =
  process.env.BASE_URL ||
  process.env.PAYAID_BRIDGE_BASE_URL ||
  process.env.VOICE_APP_BASE_URL ||
  ''
lines.push(`- BASE_URL tested: ${baseUrl || '[unset — set BASE_URL to deployed voice app]'}`)

let routeResults = []
if (baseUrl) {
  routeResults = await probeRoutes(baseUrl)
  for (const r of routeResults) {
    lines.push(`- ${r.routeExists ? 'REACHABLE' : 'FAIL'} \`${r.name}\`: ${r.note} (${r.ms}ms)`)
  }
  const allReachable = routeResults.every((r) => r.routeExists)
  lines.push(`- **Bridge routes on host:** ${allReachable ? 'YES' : 'NO'}`)
} else {
  lines.push('- Skipped (no BASE_URL). Deploy voice: `npm run deploy:voice` then set BASE_URL to production URL.')
}

lines.push('')
lines.push('## Next commands')
lines.push('')
lines.push('```sh')
lines.push('# After BASE_URL + env are set in .env.local:')
lines.push('npm run smoke:voice-agent:bolna-bridge-stage1')
lines.push('npm run evidence:voice-agent:bolna-latency')
lines.push('```')

writeFileSync(outPath, `${lines.join('\n')}\n`)
console.log(JSON.stringify({ ok: migrationOk, outPath, baseUrl: baseUrl || null }, null, 2))
process.exit(migrationOk ? 0 : 1)
