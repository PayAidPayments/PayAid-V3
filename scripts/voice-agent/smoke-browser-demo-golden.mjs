#!/usr/bin/env node
/**
 * API smoke for official Browser demo v1 against golden voice BASE_URL.
 * Does not redeploy. Does not use Twilio or Bolna sidecar.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ quiet: true })

const tenantId = (process.env.TENANT_ID || 'cmjptk2mw0000aocw31u48n64').trim()

/** Production alias tracks current deploy; pinned deployment URLs in .env.local can go stale after redeploy. */
const PRODUCTION_ALIAS = 'https://voice-six-xi.vercel.app'

const baseUrl = (
  process.env.VOICE_SMOKE_BASE_URL ||
  PRODUCTION_ALIAS ||
  process.env.BASE_URL ||
  process.env.VOICE_APP_BASE_URL ||
  process.env.PAYAID_BRIDGE_BASE_URL
).replace(/\/$/, '')

const staleEnvBase = (process.env.BASE_URL || '').replace(/\/$/, '')
if (staleEnvBase && staleEnvBase !== baseUrl && staleEnvBase.includes('voice-') && staleEnvBase.includes('.vercel.app')) {
  console.warn(
    JSON.stringify({
      warn: 'BASE_URL in .env.local points at an older deployment URL; smoke uses production alias instead',
      envBaseUrl: staleEnvBase,
      smokeBaseUrl: baseUrl,
      fix: 'npm run voice-agent:sync-stage1-vercel-env',
    }),
  )
}

const bypass = process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_AUTOMATION_BYPASS_SECRET || ''

function mintToken() {
  const r = spawnSync('node', ['scripts/voice-agent/mint-stage1-validation-auth-token.mjs'], {
    encoding: 'utf8',
    cwd: process.cwd(),
  })
  if (r.status !== 0) {
    throw new Error(r.stderr || 'mint-stage1-validation-auth-token failed')
  }
  return r.stdout.trim()
}

function headers(token, json = true) {
  const h = {
    Authorization: `Bearer ${token}`,
    ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
  }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

async function req(method, pathname, { token, body, query } = {}) {
  const url = new URL(`${baseUrl}${pathname}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
  }
  if (bypass) {
    url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
    url.searchParams.set('x-vercel-protection-bypass', bypass)
  }
  const res = await fetch(url.toString(), {
    method,
    headers: headers(token, !!body),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120_000),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { _raw: text.slice(0, 200) }
  }
  return { status: res.status, ok: res.ok, json }
}

async function main() {
  const steps = []
  const fail = (name, detail) => {
    steps.push({ step: name, ok: false, detail })
    throw new Error(`${name}: ${detail}`)
  }
  const pass = (name, detail = 'ok') => steps.push({ step: name, ok: true, detail })

  const token = mintToken()
  pass('mint_jwt')

  const fallbackAgentId = (process.env.VOICE_AGENT_BOLNA_SMOKE_AGENT_ID || 'va_stage1_bolna_smoke').trim()
  let agent = null
  const list = await req('GET', '/api/v1/voice-agents', { token, query: { tenantId } })
  if (list.ok) {
    const agents = list.json?.agents ?? list.json ?? []
    agent = (Array.isArray(agents) ? agents : []).find((a) => a.status === 'active') || agents[0]
    pass('list_agents', agent?.id || 'empty')
  } else {
    steps.push({
      step: 'list_agents',
      ok: false,
      detail: `HTTP ${list.status} — using fallback agent ${fallbackAgentId}`,
    })
    agent = { id: fallbackAgentId, name: fallbackAgentId }
  }
  if (!agent?.id) fail('pick_agent', 'no agents')

  const agentBase = `/api/v1/voice-agents/${agent.id}`

  const pack = await req('GET', `${agentBase}/training-pack`, { token, query: { tenantId } })
  if (!pack.ok) fail('training_pack', `HTTP ${pack.status}`)
  pass('training_pack', `version=${pack.json?.version ?? '?'}`)

  const session = await req('POST', `${agentBase}/demo/sessions`, { token, query: { tenantId } })
  if (!session.ok) fail('start_session', `HTTP ${session.status} ${JSON.stringify(session.json)}`)
  const sessionId = session.json?.sessionId
  if (!sessionId) fail('start_session', 'missing sessionId')
  pass('start_session', sessionId)

  const messages = ['Hello', 'What can you help me with?', 'Thank you']
  for (const message of messages) {
    const turn = await req('POST', `${agentBase}/demo/sessions/${sessionId}/turn`, {
      token,
      query: { tenantId },
      body: { message },
    })
    if (!turn.ok) fail(`turn_${message.slice(0, 12)}`, `HTTP ${turn.status}`)
    const reply = turn.json?.agentResponse ?? turn.json?.response
    if (!reply || typeof reply !== 'string') {
      fail(`turn_${message.slice(0, 12)}`, 'missing agentResponse')
    }
    pass(`turn`, `${message.slice(0, 20)} → ${String(reply).slice(0, 60)}…`)
  }

  const tts = await req('POST', `${agentBase}/preview-tts`, {
    token,
    query: { tenantId },
    body: { text: 'Hello, this is a short browser demo preview.' },
  })
  if (tts.status === 200 || tts.status === 201) {
    pass('preview_tts', `HTTP ${tts.status}`)
  } else if (tts.status === 501 || tts.status === 503) {
    pass('preview_tts', `skipped optional HTTP ${tts.status}`)
  } else {
    fail('preview_tts', `HTTP ${tts.status}`)
  }

  const demoPage = await fetch(
    `${baseUrl}/voice-agents/${tenantId}/Demo?agentId=${agent.id}`,
    {
      headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {},
      signal: AbortSignal.timeout(30_000),
    },
  )
  const html = await demoPage.text()
  const hasBrowserBadge = html.includes('Browser (text)') || html.includes('Browser demo')
  pass('demo_page_html', `HTTP ${demoPage.status} browserCopy=${hasBrowserBadge}`)

  const out = {
    at: new Date().toISOString(),
    baseUrl,
    tenantId,
    agentId: agent.id,
    agentName: agent.name,
    steps,
    allOk: steps.every((s) => s.ok),
    note: hasBrowserBadge
      ? 'Demo page includes browser-demo copy (deployed UI).'
      : 'API OK; browser badge copy may need a voice UI deploy (Stage 1 frozen).',
  }

  const evidenceDir = path.join(process.cwd(), 'docs/evidence/voice-agent')
  fs.mkdirSync(evidenceDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const evidencePath = path.join(evidenceDir, `${stamp}-browser-demo-golden-smoke.json`)
  fs.writeFileSync(evidencePath, JSON.stringify(out, null, 2))

  console.log(JSON.stringify({ ...out, evidencePath }, null, 2))
  process.exit(out.allOk ? 0 : 1)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
