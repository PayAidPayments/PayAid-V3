import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

// ── Shared scoring logic (mirrors [id]/route.ts) ─────────────────────────────

type RiskFactor = {
  key: string
  label: string
  impact: 'positive' | 'negative' | 'neutral'
  detail: string
}

function healthLabel(score: number): 'healthy' | 'at_risk' | 'critical' {
  if (score >= 70) return 'healthy'
  if (score >= 40) return 'at_risk'
  return 'critical'
}

function computeHealthScore(deal: {
  stage: string
  value: number
  probability: number
  expectedCloseDate: Date | null
  updatedAt: Date
  actualCloseDate: Date | null
}): { score: number; factors: RiskFactor[] } {
  const now = Date.now()
  const daysSinceUpdate = (now - deal.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
  const daysUntilClose = deal.expectedCloseDate
    ? (deal.expectedCloseDate.getTime() - now) / (1000 * 60 * 60 * 24)
    : null

  if (deal.stage === 'closed_won') return { score: 100, factors: [{ key: 'won', label: 'Deal won', impact: 'positive', detail: 'Closed-won' }] }
  if (deal.stage === 'closed_lost') return { score: 0, factors: [{ key: 'lost', label: 'Deal lost', impact: 'negative', detail: 'Closed-lost' }] }

  let score = 70
  const factors: RiskFactor[] = []

  if (daysSinceUpdate > 30) {
    score -= 20
    factors.push({ key: 'stale_30d', label: 'Stale 30+ days', impact: 'negative', detail: `${Math.round(daysSinceUpdate)}d since update` })
  } else if (daysSinceUpdate > 14) {
    score -= 10
    factors.push({ key: 'stale_14d', label: 'Stale 14+ days', impact: 'negative', detail: `${Math.round(daysSinceUpdate)}d since update` })
  } else {
    factors.push({ key: 'recent_activity', label: 'Recent activity', impact: 'positive', detail: `Updated ${Math.round(daysSinceUpdate)}d ago` })
  }

  if (deal.probability >= 70) {
    score += 10
    factors.push({ key: 'high_probability', label: 'High probability', impact: 'positive', detail: `${deal.probability}%` })
  } else if (deal.probability < 30) {
    score -= 15
    factors.push({ key: 'low_probability', label: 'Low probability', impact: 'negative', detail: `${deal.probability}%` })
  }

  if (daysUntilClose !== null) {
    if (daysUntilClose < 0) {
      score -= 20
      factors.push({ key: 'overdue', label: 'Close date passed', impact: 'negative', detail: `${Math.abs(Math.round(daysUntilClose))}d overdue` })
    } else if (daysUntilClose < 7) {
      score += 5
      factors.push({ key: 'closing_soon', label: 'Closing in <7d', impact: 'positive', detail: `${Math.round(daysUntilClose)}d left` })
    }
  } else {
    score -= 5
    factors.push({ key: 'no_close_date', label: 'No close date', impact: 'negative', detail: 'Not set' })
  }

  const lateStages = ['proposal', 'negotiation', 'contract']
  if (lateStages.includes(deal.stage)) {
    score += 5
    factors.push({ key: 'late_stage', label: 'Late stage', impact: 'positive', detail: deal.stage })
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), factors }
}

// ── Request schema ────────────────────────────────────────────────────────────

const bodySchema = z.object({
  deal_ids: z
    .array(z.string())
    .min(1, 'At least one deal_id required')
    .max(50, 'Maximum 50 deal IDs per batch'),
})

/**
 * POST /api/v1/revenue/deal-health/batch
 *
 * Returns health scores for up to 50 deals in a single request.
 * Deals not belonging to the tenant are silently omitted.
 * Feature gate: m1_revenue_intelligence
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')

    const body = await request.json()
    const { deal_ids } = bodySchema.parse(body)

    const deals = await prisma.deal.findMany({
      where: { id: { in: deal_ids }, tenantId },
      select: {
        id: true,
        name: true,
        stage: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
        actualCloseDate: true,
        updatedAt: true,
      },
    })

    const results = deals.map((deal) => {
      const { score, factors } = computeHealthScore(deal)
      return {
        deal_id: deal.id,
        deal_name: deal.name,
        stage: deal.stage,
        value: deal.value,
        health_score: score,
        health_label: healthLabel(score),
        top_factor: factors[0] ?? null,
        computed_at: new Date().toISOString(),
      }
    })

    // Preserve original request order
    const resultMap = new Map(results.map((r) => [r.deal_id, r]))
    const ordered = deal_ids.map((id) => resultMap.get(id)).filter(Boolean)

    return NextResponse.json({
      results: ordered,
      found: results.length,
      requested: deal_ids.length,
      computed_at: new Date().toISOString(),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    console.error('[revenue/deal-health/batch] error:', error)
    return NextResponse.json({ error: 'Failed to compute batch deal health' }, { status: 500 })
  }
}
