import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

/**
 * GET /api/v1/ai/decisions/stats
 *
 * Aggregate statistics for AI decisions: acceptance rate, override rate,
 * breakdown by decision type, and outcome distribution.
 *
 * Query params: ?window_days=7|30|90 (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm3_governance')
    const url = new URL(request.url)
    const windowDays = Math.min(parseInt(url.searchParams.get('window_days') ?? '30', 10), 90)
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

    const [decisions, overrides] = await Promise.all([
      prisma.auditLog.findMany({
        where: { tenantId, entityType: 'ai_decision', timestamp: { gte: since } },
        select: { id: true, afterSnapshot: true, timestamp: true },
        take: 2000,
      }),
      prisma.auditLog.count({
        where: { tenantId, entityType: 'ai_decision_override', timestamp: { gte: since } },
      }),
    ])

    const total = decisions.length
    let accepted = 0
    let rejected = 0
    let pending = 0
    const byType: Record<string, { total: number; accepted: number }> = {}
    const confidences: number[] = []

    for (const d of decisions) {
      const snap = d.afterSnapshot as Record<string, unknown> | null
      const outcome = snap?.outcome as string | undefined
      const type = (snap?.type as string) ?? 'unknown'
      const confidence = snap?.confidence as number | undefined

      if (outcome === 'accepted') accepted++
      else if (outcome === 'rejected' || outcome === 'overridden') rejected++
      else pending++

      if (confidence != null && typeof confidence === 'number') {
        confidences.push(confidence)
      }

      byType[type] = byType[type] ?? { total: 0, accepted: 0 }
      byType[type].total++
      if (outcome === 'accepted') byType[type].accepted++
    }

    const acceptanceRate = total > 0 ? parseFloat(((accepted / total) * 100).toFixed(1)) : null
    const overrideRate = total > 0 ? parseFloat(((overrides / total) * 100).toFixed(1)) : null
    const avgConfidence =
      confidences.length > 0
        ? parseFloat(
            (confidences.reduce((s, c) => s + c, 0) / confidences.length).toFixed(3)
          )
        : null

    const typeBreakdown = Object.entries(byType).map(([type, stats]) => ({
      type,
      total: stats.total,
      accepted: stats.accepted,
      acceptance_rate_pct:
        stats.total > 0
          ? parseFloat(((stats.accepted / stats.total) * 100).toFixed(1))
          : null,
    }))

    return NextResponse.json({
      window_days: windowDays,
      since: since.toISOString(),
      generated_at: new Date().toISOString(),
      total_decisions: total,
      accepted,
      rejected,
      pending,
      overrides,
      acceptance_rate_pct: acceptanceRate,
      override_rate_pct: overrideRate,
      avg_confidence: avgConfidence,
      by_type: typeBreakdown,
      status:
        acceptanceRate !== null && acceptanceRate >= 40 ? 'on_target' : 'needs_review',
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('AI decisions stats error:', e)
    return NextResponse.json({ error: 'Failed to compute AI decisions stats' }, { status: 500 })
  }
}
