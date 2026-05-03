import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { isStrictFlagEnabled } from './strict-flag.mjs'

const prisma = new PrismaClient()
const FEATURE_NAME = 'leads.bulkReports.retention'
const DEFAULT_KEEP_LAST = 50
const DEFAULT_MAX_AGE_DAYS = 90
const DRY_RUN = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_DRY_RUN)
const TENANT_FILTER = process.env.LEADS_BULK_RETENTION_TENANT_ID?.trim() || null
const LOCK_TTL_MS = Math.max(
  60_000,
  Number(process.env.LEADS_BULK_RETENTION_LOCK_TTL_MS || String(2 * 60 * 60 * 1000)),
)
const lockRoot = path.join(process.cwd(), '.tmp', 'locks')
const lockPath = path.join(lockRoot, 'leads-bulk-report-retention.lock.json')
const statusPath = path.join(lockRoot, 'leads-bulk-report-retention.status.json')

function readJsonSafe(filePath) {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function writeStatus(status) {
  mkdirSync(lockRoot, { recursive: true })
  const previous = readJsonSafe(statusPath) || {}
  const state = String(status?.state || previous.state || 'unknown')
  const nowIso = new Date().toISOString()
  const isSkipped = state === 'skipped'
  const consecutiveSkipped = isSkipped ? Number(previous.consecutiveSkipped || 0) + 1 : 0
  const lastStateChangeAt = previous.state !== state ? nowIso : previous.lastStateChangeAt || nowIso
  const lastSuccessfulAt =
    state === 'completed' ? status.completedAt || nowIso : previous.lastSuccessfulAt || null

  writeFileSync(
    statusPath,
    `${JSON.stringify(
      {
        ...previous,
        ...status,
        state,
        consecutiveSkipped,
        lastSuccessfulAt,
        lastStateChangeAt,
        lockPath,
        statusPath,
        updatedAt: nowIso,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
}

function normalizeSettings(settings) {
  return {
    keepLast: Math.min(500, Math.max(1, Number(settings?.keepLast ?? DEFAULT_KEEP_LAST))),
    maxAgeDays: Math.min(3650, Math.max(1, Number(settings?.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS))),
  }
}

function computeCandidates(reports, keepLast, maxAgeDays) {
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000)
  const idsToDelete = reports
    .filter((report, index) => index >= keepLast || report.createdAt < cutoff)
    .map((report) => report.id)
  return {
    cutoffIso: cutoff.toISOString(),
    idsToDelete,
  }
}

async function run() {
  const startedAt = new Date().toISOString()
  writeStatus({
    state: 'running',
    startedAt,
    dryRun: DRY_RUN,
    tenantFilter: TENANT_FILTER,
  })

  const toggles = await prisma.featureToggle.findMany({
    where: {
      featureName: FEATURE_NAME,
      isEnabled: true,
      ...(TENANT_FILTER ? { tenantId: TENANT_FILTER } : {}),
    },
    select: {
      tenantId: true,
      settings: true,
    },
  })

  const results = []
  for (const toggle of toggles) {
    if (!toggle.tenantId) continue
    const tenantId = toggle.tenantId
    const settings = normalizeSettings(toggle.settings || {})
    const reports = await prisma.leadAuditEvent.findMany({
      where: {
        tenantId,
        entityType: 'lead_activation_set_bulk_report',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
      take: 2000,
    })

    const candidate = computeCandidates(reports, settings.keepLast, settings.maxAgeDays)
    let deleted = 0

    if (!DRY_RUN && candidate.idsToDelete.length > 0) {
      await prisma.leadAuditEvent.deleteMany({
        where: { id: { in: candidate.idsToDelete } },
      })
      deleted = candidate.idsToDelete.length
    }

    await prisma.dataRetentionLog.create({
      data: {
        tenantId,
        entityType: 'LEAD_BULK_REPORT',
        entityId: `bulk-reports:${tenantId}`,
        action: DRY_RUN ? 'EXPORTED' : 'DELETED',
        reason: `scheduler dryRun=${DRY_RUN} keepLast=${settings.keepLast} maxAgeDays=${settings.maxAgeDays} candidates=${candidate.idsToDelete.length} deleted=${deleted} cutoff=${candidate.cutoffIso}`,
        performedBy: 'scheduler',
      },
    })

    results.push({
      tenantId,
      dryRun: DRY_RUN,
      totalReports: reports.length,
      keepLast: settings.keepLast,
      maxAgeDays: settings.maxAgeDays,
      cutoffIso: candidate.cutoffIso,
      candidateCount: candidate.idsToDelete.length,
      deleted,
    })
  }

  const payload = {
    check: 'leads-bulk-report-retention-scheduler',
    dryRun: DRY_RUN,
    tenantFilter: TENANT_FILTER,
    tenantsProcessed: results.length,
    timestamp: new Date().toISOString(),
    results,
  }

  const stamp = payload.timestamp.replace(/[:.]/g, '-')
  const closureDir = path.join(process.cwd(), 'docs', 'evidence', 'closure')
  mkdirSync(closureDir, { recursive: true })
  const jsonPath = path.join(closureDir, `${stamp}-leads-bulk-report-retention-run.json`)
  const mdPath = path.join(closureDir, `${stamp}-leads-bulk-report-retention-run.md`)
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  const markdownLines = [
    '# Leads bulk report retention run',
    '',
    `- Timestamp: ${payload.timestamp}`,
    `- Dry run: ${payload.dryRun ? 'yes' : 'no'}`,
    `- Tenant filter: ${payload.tenantFilter ?? 'none'}`,
    `- Tenants processed: ${payload.tenantsProcessed}`,
    `- JSON artifact: \`${jsonPath}\``,
    '',
    '## Results',
    '',
    ...results.map(
      (result) =>
        `- tenant=${result.tenantId} total=${result.totalReports} keepLast=${result.keepLast} maxAgeDays=${result.maxAgeDays} candidates=${result.candidateCount} deleted=${result.deleted}`,
    ),
    '',
    '## Raw payload',
    '',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    '',
  ]
  writeFileSync(mdPath, markdownLines.join('\n'), 'utf8')

  writeStatus({
    state: 'completed',
    startedAt,
    completedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    tenantFilter: TENANT_FILTER,
    tenantsProcessed: results.length,
    jsonPath,
    mdPath,
    results,
  })

  console.log(JSON.stringify({ ...payload, jsonPath, mdPath }, null, 2))
}

function acquireLock() {
  mkdirSync(lockRoot, { recursive: true })
  const now = Date.now()
  const lockPayload = {
    pid: process.pid,
    startedAt: new Date(now).toISOString(),
    dryRun: DRY_RUN,
    tenantFilter: TENANT_FILTER,
  }

  if (!existsSync(lockPath)) {
    writeFileSync(lockPath, `${JSON.stringify(lockPayload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    return { acquired: true, staleRecovered: false }
  }

  let existing = null
  try {
    existing = JSON.parse(readFileSync(lockPath, 'utf8'))
  } catch {
    existing = null
  }
  const existingStartedAt = Date.parse(String(existing?.startedAt ?? ''))
  const stale = Number.isFinite(existingStartedAt) ? now - existingStartedAt > LOCK_TTL_MS : true

  if (!stale) {
    const minutes = Math.round((now - existingStartedAt) / 60000)
    console.log(
      JSON.stringify(
        {
          skipped: true,
          reason: 'already_running',
          lockPath,
          lockAgeMinutes: minutes,
          lockTtlMinutes: Math.round(LOCK_TTL_MS / 60000),
          existing,
        },
        null,
        2,
      ),
    )
    writeStatus({
      state: 'skipped',
      reason: 'already_running',
      dryRun: DRY_RUN,
      tenantFilter: TENANT_FILTER,
      existingLock: existing,
      lockTtlMs: LOCK_TTL_MS,
    })
    return { acquired: false, staleRecovered: false }
  }

  rmSync(lockPath, { force: true })
  writeFileSync(lockPath, `${JSON.stringify({ ...lockPayload, staleRecovered: true }, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  })
  return { acquired: true, staleRecovered: true }
}

function releaseLock() {
  rmSync(lockPath, { force: true })
}

const lockState = acquireLock()

if (!lockState.acquired) {
  await prisma.$disconnect()
  process.exit(0)
}

run()
  .catch((error) => {
    console.error('[leads-bulk-report-retention-scheduler] failed:', error)
    writeStatus({
      state: 'failed',
      dryRun: DRY_RUN,
      tenantFilter: TENANT_FILTER,
      error: error instanceof Error ? error.message : String(error),
    })
    process.exitCode = 1
  })
  .finally(async () => {
    releaseLock()
    await prisma.$disconnect()
  })
