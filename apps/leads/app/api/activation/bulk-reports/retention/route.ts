import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

const FEATURE_NAME = 'leads.bulkReports.retention'
const DEFAULT_KEEP_LAST = 50
const DEFAULT_MAX_AGE_DAYS = 90

interface RetentionSettings {
  keepLast: number
  maxAgeDays: number
}

function normalizeSettings(input: Partial<RetentionSettings>): RetentionSettings {
  return {
    keepLast: Math.min(500, Math.max(1, Number(input.keepLast ?? DEFAULT_KEEP_LAST))),
    maxAgeDays: Math.min(3650, Math.max(1, Number(input.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS))),
  }
}

async function getSettings(tenantId: string): Promise<RetentionSettings> {
  const feature = await prisma.featureToggle.findFirst({
    where: { tenantId, featureName: FEATURE_NAME },
    select: { settings: true },
  })
  const settings = (feature?.settings ?? {}) as Partial<RetentionSettings>
  return normalizeSettings(settings)
}

async function computeDeletionCandidates(tenantId: string, settings: RetentionSettings) {
  const cutoff = new Date(Date.now() - settings.maxAgeDays * 24 * 60 * 60 * 1000)
  const reports = await prisma.leadAuditEvent.findMany({
    where: {
      tenantId,
      entityType: 'lead_activation_set_bulk_report',
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true },
    take: 1000,
  })

  const idsToDelete = reports
    .filter((report, index) => index >= settings.keepLast || report.createdAt < cutoff)
    .map((report) => report.id)

  return {
    totalReports: reports.length,
    wouldDelete: idsToDelete.length,
    keepLastApplied: settings.keepLast,
    maxAgeDaysApplied: settings.maxAgeDays,
    cutoffIso: cutoff.toISOString(),
    idsToDelete,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const settings = await getSettings(tenantId)
  return NextResponse.json({ settings })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tenantId?: string
    keepLast?: number
    maxAgeDays?: number
    applyNow?: boolean
    performedBy?: string
  }
  const tenantId = body.tenantId?.trim()
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const settings = normalizeSettings({ keepLast: body.keepLast, maxAgeDays: body.maxAgeDays })
  const dryRun = Boolean((body as { dryRun?: boolean }).dryRun)

  if (dryRun) {
    const preview = await computeDeletionCandidates(tenantId, settings)
    return NextResponse.json({
      settings,
      preview: {
        totalReports: preview.totalReports,
        wouldDelete: preview.wouldDelete,
        keepLastApplied: preview.keepLastApplied,
        maxAgeDaysApplied: preview.maxAgeDaysApplied,
        cutoffIso: preview.cutoffIso,
      },
    })
  }

  const existing = await prisma.featureToggle.findFirst({
    where: { tenantId, featureName: FEATURE_NAME },
    select: { id: true },
  })

  if (existing) {
    await prisma.featureToggle.update({
      where: { id: existing.id },
      data: { isEnabled: true, settings },
    })
  } else {
    await prisma.featureToggle.create({
      data: {
        tenantId,
        featureName: FEATURE_NAME,
        isEnabled: true,
        settings,
      },
    })
  }

  let deleted = 0
  if (body.applyNow) {
    const preview = await computeDeletionCandidates(tenantId, settings)
    const idsToDelete = preview.idsToDelete

    if (idsToDelete.length > 0) {
      await prisma.leadAuditEvent.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      })
      deleted = idsToDelete.length
    }

    await prisma.dataRetentionLog.create({
      data: {
        tenantId,
        entityType: 'LEAD_BULK_REPORT',
        entityId: `bulk-reports:${tenantId}`,
        action: 'DELETED',
        reason: `Retention applyNow keepLast=${settings.keepLast}, maxAgeDays=${settings.maxAgeDays}, deleted=${deleted}, cutoff=${preview.cutoffIso}`,
        performedBy: body.performedBy?.trim() || 'system',
      },
    })
  }

  return NextResponse.json({ settings, deleted })
}
