import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { prisma } from '@payaid/db'

const lockRoot = path.join(process.cwd(), '.tmp', 'locks')
const lockPath = path.join(lockRoot, 'leads-bulk-report-retention.lock.json')
const statusPath = path.join(lockRoot, 'leads-bulk-report-retention.status.json')
const DEFAULT_STALE_MINUTES = 180
const DEFAULT_RUNNING_MAX_MINUTES = 180
const DEFAULT_SKIP_WARN_COUNT = 3

function readJsonSafe(filePath: string) {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function minutesSince(isoValue: unknown): number | null {
  const ms = Date.parse(String(isoValue ?? ''))
  if (!Number.isFinite(ms)) return null
  return Math.max(0, Math.round((Date.now() - ms) / 60000))
}

function toNumber(value: string | null, fallback: number): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
  const staleAfterMinutes = toNumber(searchParams.get('staleAfterMinutes'), DEFAULT_STALE_MINUTES)
  const runningMaxMinutes = toNumber(searchParams.get('runningMaxMinutes'), DEFAULT_RUNNING_MAX_MINUTES)
  const skipWarnCount = toNumber(searchParams.get('skipWarnCount'), DEFAULT_SKIP_WARN_COUNT)

  const [latestRetentionLog, latestBulkReport] = await Promise.all([
    prisma.dataRetentionLog.findFirst({
      where: {
        tenantId,
        entityType: 'LEAD_BULK_REPORT',
      },
      orderBy: { performedAt: 'desc' },
      select: {
        id: true,
        action: true,
        reason: true,
        performedAt: true,
        performedBy: true,
      },
    }),
    prisma.leadAuditEvent.findFirst({
      where: {
        tenantId,
        entityType: 'lead_activation_set_bulk_report',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        entityId: true,
        createdAt: true,
      },
    }),
  ])

  const lock = readJsonSafe(lockPath)
  const status = readJsonSafe(statusPath)
  const statusAgeMinutes = minutesSince(status?.updatedAt)
  const runningForMinutes = minutesSince(status?.startedAt)
  const state = String(status?.state ?? 'unknown')
  const reasons: string[] = []
  let severity: 'healthy' | 'warning' | 'critical' = 'healthy'

  if (!status) {
    severity = 'warning'
    reasons.push('scheduler_status_missing')
  }

  if (statusAgeMinutes !== null && statusAgeMinutes > staleAfterMinutes) {
    severity = severity === 'critical' ? 'critical' : 'warning'
    reasons.push('status_stale')
  }

  if (state === 'running' && runningForMinutes !== null && runningForMinutes > runningMaxMinutes) {
    severity = 'critical'
    reasons.push('running_too_long')
  }

  if (state === 'failed') {
    severity = 'critical'
    reasons.push('last_run_failed')
  }

  const consecutiveSkipped = Number(status?.consecutiveSkipped ?? 0)
  if (consecutiveSkipped >= skipWarnCount) {
    severity = severity === 'critical' ? 'critical' : 'warning'
    reasons.push('repeated_skips')
  }

  return NextResponse.json({
    scheduler: {
      lockPath,
      statusPath,
      hasActiveLock: Boolean(lock),
      lock,
      status,
      health: {
        ok: severity === 'healthy',
        severity,
        reasons,
        evaluatedAt: new Date().toISOString(),
        thresholds: {
          staleAfterMinutes,
          runningMaxMinutes,
          skipWarnCount,
        },
        metrics: {
          statusAgeMinutes,
          runningForMinutes,
          consecutiveSkipped,
          state,
        },
      },
    },
    latestRetentionLog,
    latestBulkReport,
  })
}
