import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

const ENTITY_TYPE = 'ai_decision'
const ALLOWED_OUTCOMES = ['accepted', 'rejected', 'overridden', 'ignored', 'pending']
const ALLOWED_TYPES = ['sdr', 'cpq', 'call', 'sequence', 'workflow', 'recommendation']

/**
 * GET /api/v1/ai/decisions
 *
 * Paginated list of AI decision events from AuditLog.
 * Query params: ?type=sdr|cpq|call|... ?outcome=accepted|overridden|...
 *               ?limit=25 (max 100) ?page=1 ?window_days=7 (default 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm3_governance')
    const url = new URL(request.url)

    const typeParam = url.searchParams.get('type')
    const outcomeParam = url.searchParams.get('outcome')
    const windowDays = Math.min(parseInt(url.searchParams.get('window_days') ?? '30', 10), 90)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '25', 10), 100)
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1)
    const skip = (page - 1) * limit
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

    const type = typeParam && ALLOWED_TYPES.includes(typeParam) ? typeParam : undefined
    const outcome =
      outcomeParam && ALLOWED_OUTCOMES.includes(outcomeParam) ? outcomeParam : undefined

    const where: Record<string, unknown> = {
      tenantId,
      entityType: ENTITY_TYPE,
      timestamp: { gte: since },
    }

    if (type) {
      where.beforeSnapshot = { path: ['type'], equals: type }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          entityId: true,
          changedBy: true,
          changeSummary: true,
          afterSnapshot: true,
          timestamp: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    const decisions = logs
      .map((l) => {
        const snap = l.afterSnapshot as Record<string, unknown> | null
        if (!snap) return null
        const decisionOutcome = snap.outcome as string | undefined
        if (outcome && decisionOutcome !== outcome) return null
        return {
          id: l.id,
          entity_id: l.entityId,
          type: snap.type ?? 'unknown',
          action: snap.action ?? snap.changeSummary ?? l.changeSummary,
          confidence: snap.confidence ?? null,
          outcome: decisionOutcome ?? 'pending',
          actor: l.changedBy ?? 'system',
          override_reason: snap.override_reason ?? null,
          reasoning_trace: snap.reasoning_trace ?? null,
          created_at: l.timestamp,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      decisions,
      pagination: { total, limit, page, pages: Math.ceil(total / limit) },
      window_days: windowDays,
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('AI decisions list error:', e)
    return NextResponse.json({ error: 'Failed to list AI decisions' }, { status: 500 })
  }
}
