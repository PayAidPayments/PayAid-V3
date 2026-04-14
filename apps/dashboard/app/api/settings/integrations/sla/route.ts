import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'

type SlaBucket = {
  key: 'smtp' | 'waha' | 'telephony' | 'social'
  label: string
  success_count: number
  failure_count: number
  uptime_pct: number
  mttr_minutes: number | null
}

const WINDOW_OPTIONS = new Set(['7', '30', '90'])

function mapBucket(label: SlaBucket['label'], key: SlaBucket['key']) {
  return {
    key,
    label,
    success_count: 0,
    failure_count: 0,
    uptime_pct: 100,
    mttr_minutes: null as number | null,
  }
}

function classifySource(entityType: string, scope: string): SlaBucket['key'] | null {
  if (entityType === 'integration_smtp' || scope.includes('smtp')) return 'smtp'
  if (entityType === 'integration_waha' || scope.includes('waha')) return 'waha'
  if (entityType === 'integration_telephony' || scope.includes('telephony') || scope.includes('webhook')) return 'telephony'
  if (entityType === 'integration_social' || scope.includes('social') || scope.includes('linkedin')) return 'social'
  return null
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const windowDaysRaw = new URL(request.url).searchParams.get('window_days') || '30'
    const windowDays = WINDOW_OPTIONS.has(windowDaysRaw) ? Number(windowDaysRaw) : 30
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

    const [auditRows, errorRows] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          tenantId: user.tenantId,
          timestamp: { gte: since },
          entityType: { in: ['integration_smtp', 'integration_waha', 'integration_telephony', 'integration_social'] },
        },
        select: { entityType: true, changeSummary: true, timestamp: true },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.auditLog.findMany({
        where: {
          tenantId: user.tenantId,
          timestamp: { gte: since },
          entityType: 'integration_error',
        },
        select: { entityId: true, timestamp: true },
        orderBy: { timestamp: 'asc' },
      }),
    ])

    const buckets: Record<SlaBucket['key'], SlaBucket> = {
      smtp: mapBucket('SMTP', 'smtp'),
      waha: mapBucket('WAHA', 'waha'),
      telephony: mapBucket('Telephony', 'telephony'),
      social: mapBucket('Social', 'social'),
    }

    const eventsByBucket: Record<SlaBucket['key'], Array<{ status: 'success' | 'failure'; ts: Date }>> = {
      smtp: [],
      waha: [],
      telephony: [],
      social: [],
    }

    for (const row of auditRows) {
      const bucket = classifySource(row.entityType, row.changeSummary || '')
      if (!bucket) continue
      const summary = (row.changeSummary || '').toLowerCase()
      const isFailure = summary.includes('failed')
      const isSuccess = summary.includes('passed') || summary.includes('validated')
      if (!isFailure && !isSuccess) continue

      if (isFailure) buckets[bucket].failure_count += 1
      if (isSuccess) buckets[bucket].success_count += 1
      eventsByBucket[bucket].push({ status: isFailure ? 'failure' : 'success', ts: row.timestamp })
    }

    // Include captured integration_error rows as failures for SLA posture.
    for (const err of errorRows) {
      const bucket = classifySource('integration_error', err.entityId || '')
      if (!bucket) continue
      buckets[bucket].failure_count += 1
      eventsByBucket[bucket].push({ status: 'failure', ts: err.timestamp })
    }

    for (const key of Object.keys(buckets) as SlaBucket['key'][]) {
      const b = buckets[key]
      const total = b.success_count + b.failure_count
      b.uptime_pct = total > 0 ? Number(((b.success_count / total) * 100).toFixed(2)) : 100

      // MTTR approximation: avg minutes from failure event to next success event.
      const ordered = eventsByBucket[key].sort((a, b2) => a.ts.getTime() - b2.ts.getTime())
      const repairs: number[] = []
      for (let i = 0; i < ordered.length; i += 1) {
        if (ordered[i].status !== 'failure') continue
        const failAt = ordered[i].ts.getTime()
        const nextSuccess = ordered.slice(i + 1).find((e) => e.status === 'success')
        if (!nextSuccess) continue
        repairs.push((nextSuccess.ts.getTime() - failAt) / 60000)
      }
      b.mttr_minutes = repairs.length > 0 ? Number((repairs.reduce((a, c) => a + c, 0) / repairs.length).toFixed(2)) : null
    }

    const rows = Object.values(buckets)
    const avgUptime = rows.length > 0 ? Number((rows.reduce((a, r) => a + r.uptime_pct, 0) / rows.length).toFixed(2)) : 100
    const totalFailures = rows.reduce((a, r) => a + r.failure_count, 0)
    const totalSuccess = rows.reduce((a, r) => a + r.success_count, 0)

    return NextResponse.json({
      window_days: windowDays,
      summary: {
        average_uptime_pct: avgUptime,
        total_success_events: totalSuccess,
        total_failure_events: totalFailures,
      },
      modules: rows,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('Integration SLA dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load integration SLA metrics' }, { status: 500 })
  }
}

