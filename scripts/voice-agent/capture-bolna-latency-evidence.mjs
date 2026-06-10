#!/usr/bin/env node
/**
 * Speed Auditor Stage 1 evidence: fetch analytics.realtime.firstAudioMs and compare to targets.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import dotenv from 'dotenv'

const root = process.cwd()
dotenv.config({ quiet: true })
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')

const TARGET_P50_MS = 1000
const TARGET_P95_MS = 1600

function getEnv(...keys) {
  for (const key of keys) {
    const v = process.env[key]
    if (v && String(v).trim()) return String(v).trim()
  }
  return ''
}

function withVercelBypass(url, bypass) {
  if (!bypass) return url
  const u = new URL(url)
  u.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  u.searchParams.set('x-vercel-protection-bypass', bypass)
  return u.toString()
}

function resolveAuthToken() {
  const pinned = getEnv('STAGE1_VALIDATION_AUTH_TOKEN')
  if (pinned) return pinned
  const mint = spawnSync('node', ['scripts/voice-agent/mint-stage1-validation-auth-token.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })
  const token = mint.status === 0 ? String(mint.stdout || '').trim() : ''
  if (token) return token
  return getEnv('AUTH_TOKEN', 'API_AUTH_TOKEN', 'VOICE_AGENT_BOLNA_SMOKE_AUTH_TOKEN')
}

async function main() {
  const baseUrl = getEnv('BASE_URL', 'APP_BASE_URL', 'NEXT_PUBLIC_APP_URL').replace(/\/$/, '')
  const authToken = resolveAuthToken()
  const vercelBypass = getEnv('VERCEL_PROTECTION_BYPASS', 'VERCEL_AUTOMATION_BYPASS_SECRET')
  const period = getEnv('VOICE_AGENT_LATENCY_PERIOD') || 'week'
  const timeoutMs = Number(process.env.VOICE_AGENT_BOLNA_SMOKE_TIMEOUT_MS || '90000')

  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'voice-agent')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${stamp}-bolna-latency-evidence.md`)

  const lines = [
    '# Bolna Latency Evidence (Stage 1)',
    '',
    `- Timestamp: ${iso}`,
    `- Period: ${period}`,
    `- Targets: p50 first-audio < ${TARGET_P50_MS}ms, p95 < ${TARGET_P95_MS}ms`,
    '',
  ]

  if (!baseUrl || !authToken) {
    lines.push('## Result', '', '- FAIL: set BASE_URL and AUTH_TOKEN (or API_AUTH_TOKEN)')
    writeFileSync(outputPath, `${lines.join('\n')}\n`)
    console.log(JSON.stringify({ ok: false, outputPath }, null, 2))
    process.exit(1)
  }

  const url = withVercelBypass(
    `${baseUrl}/api/v1/voice-agents/analytics?period=${encodeURIComponent(period)}`,
    vercelBypass,
  )
  let res
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
        ...(vercelBypass ? { 'x-vercel-protection-bypass': vercelBypass } : {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    lines.push('## Result', '', `- FAIL fetch: ${error instanceof Error ? error.message : String(error)}`)
    writeFileSync(outputPath, `${lines.join('\n')}\n`)
    process.exit(1)
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    lines.push('## Result', '', `- FAIL: analytics HTTP ${res.status}`)
    lines.push('', '```json', JSON.stringify(json, null, 2).slice(0, 2000), '```')
    writeFileSync(outputPath, `${lines.join('\n')}\n`)
    console.log(JSON.stringify({ ok: false, outputPath, httpStatus: res.status }, null, 2))
    process.exit(1)
  }
  const rt = json?.analytics?.realtime
  const fa = rt?.firstAudioMs ?? {}

  const p50 = fa.p50Bolna ?? fa.p50
  const p95 = fa.p95Bolna ?? fa.p95
  const samples = fa.samples ?? 0

  const p50Pass = p50 == null ? null : p50 < TARGET_P50_MS
  const p95Pass = p95 == null ? null : p95 < TARGET_P95_MS
  const hasSamples = samples > 0

  lines.push('## KPI snapshot', '')
  lines.push(`- samples: ${samples}`)
  lines.push(`- p50 (bolna preferred): ${p50 ?? 'n/a'} ms`)
  lines.push(`- p95 (bolna preferred): ${p95 ?? 'n/a'} ms`)
  lines.push(`- bargeInCount: ${rt?.bargeInCount ?? 'n/a'}`)
  lines.push(`- interruptedTokens: ${rt?.interruptedTokens ?? 'n/a'}`)
  lines.push('')
  lines.push('## Speed Auditor gate', '')
  if (!hasSamples) {
    lines.push('- INCONCLUSIVE: no firstAudioMs samples in period (run pilot calls first)')
  } else {
    lines.push(`- p50 target: ${p50Pass ? 'PASS' : 'FAIL'}`)
    lines.push(`- p95 target: ${p95Pass ? 'PASS' : 'FAIL'}`)
  }
  lines.push('')
  lines.push('## Raw realtime block', '', '```json', JSON.stringify(rt ?? null, null, 2), '```')

  writeFileSync(outputPath, `${lines.join('\n')}\n`)

  const ok = hasSamples && p50Pass === true && p95Pass === true
  console.log(JSON.stringify({ ok, outputPath, samples, p50, p95 }, null, 2))
  process.exit(ok ? 0 : hasSamples ? 1 : 2)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
