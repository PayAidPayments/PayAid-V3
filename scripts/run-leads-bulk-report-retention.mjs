import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { isStrictFlagEnabled } from './strict-flag.mjs'

const prisma = new PrismaClient()
const FEATURE_NAME = 'leads.bulkReports.retention'
const DEFAULT_KEEP_LAST = 50
const DEFAULT_MAX_AGE_DAYS = 90
const DRY_RUN = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_DRY_RUN)
const TENANT_FILTER = process.env.LEADS_BULK_RETENTION_TENANT_ID?.trim() || null

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

  console.log(JSON.stringify({ ...payload, jsonPath, mdPath }, null, 2))
}

run()
  .catch((error) => {
    console.error('[leads-bulk-report-retention-scheduler] failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
