#!/usr/bin/env node
/**
 * DB-direct latency evidence (no HTTP). Mirrors analytics.realtime.firstAudioMs shaping.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { computeFirstAudioPercentiles } from '../../lib/voice-agent/runtime/bolna-events.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const TARGET_P50_MS = 1000
const TARGET_P95_MS = 1600
const tenantId = process.env.TENANT_ID || 'cmjptk2mw0000aocw31u48n64'
const periodDays = Number(process.env.VOICE_AGENT_LATENCY_PERIOD_DAYS || '7')
const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

const prisma = new PrismaClient()
const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')
const outputPath = path.join(root, 'docs/evidence/voice-agent', `${stamp}-bolna-latency-evidence-db.md`)

try {
  const rows = await prisma.voiceAgentCall.findMany({
    where: { tenantId, firstAudioMs: { not: null }, createdAt: { gte: since } },
    select: { firstAudioMs: true, runtime: true, bargeInCount: true, interruptedTokens: true },
    take: 5000,
    orderBy: { createdAt: 'desc' },
  })
  const samples = rows
    .filter((r) => r.firstAudioMs != null)
    .map((r) => ({ firstAudioMs: r.firstAudioMs, runtime: r.runtime }))
  const fa = computeFirstAudioPercentiles(samples)
  const p50 = fa.p50Bolna ?? fa.p50
  const p95 = fa.p95Bolna ?? fa.p95
  const bargeInCount = rows.reduce((s, r) => s + (r.bargeInCount ?? 0), 0)
  const interruptedTokens = rows.reduce((s, r) => s + (r.interruptedTokens ?? 0), 0)

  const hasSamples = fa.samples > 0
  const p50Pass = p50 == null ? null : p50 < TARGET_P50_MS
  const p95Pass = p95 == null ? null : p95 < TARGET_P95_MS

  const lines = [
    '# Bolna Latency Evidence (DB direct)',
    '',
    `- Timestamp: ${iso}`,
    `- Tenant: ${tenantId}`,
    `- Window: last ${periodDays} days`,
    `- Targets: p50 < ${TARGET_P50_MS}ms, p95 < ${TARGET_P95_MS}ms`,
    '',
    '## KPI snapshot',
    '',
    `- samples: ${fa.samples}`,
    `- p50 (bolna preferred): ${p50 ?? 'n/a'} ms`,
    `- p95 (bolna preferred): ${p95 ?? 'n/a'} ms`,
    `- bargeInCount: ${bargeInCount}`,
    `- interruptedTokens: ${interruptedTokens}`,
    '',
    '## Speed Auditor gate',
    '',
  ]
  if (!hasSamples) {
    lines.push('- INCONCLUSIVE: no firstAudioMs samples in period')
  } else {
    lines.push(`- p50 target: ${p50Pass ? 'PASS' : 'FAIL'}`)
    lines.push(`- p95 target: ${p95Pass ? 'PASS' : 'FAIL'}`)
    lines.push('- Note: seeded pilot rows count; replace with real Bolna pilot calls for production sign-off.')
  }

  writeFileSync(outputPath, `${lines.join('\n')}\n`)
  const ok = hasSamples && p50Pass === true && p95Pass === true
  console.log(JSON.stringify({ ok, outputPath, samples: fa.samples, p50, p95 }, null, 2))
  process.exit(ok ? 0 : hasSamples ? 1 : 2)
} catch (e) {
  console.error(e)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
