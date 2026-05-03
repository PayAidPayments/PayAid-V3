import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

type RiskFactor = {
  key: string
  label: string
  impact: 'positive' | 'negative' | 'neutral'
  detail: string
}

/**
 * Rule-based deal health score (0–100).
 * Higher = healthier. Penalties applied for staleness, low probability, high value at late stage, etc.
 */
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

  let score = 70 // Baseline
  const factors: RiskFactor[] = []

  // ── Staleness penalty ─────────────────────────────────────────────────────
  if (daysSinceUpdate > 30) {
    score -= 20
    factors.push({ key: 'stale_30d', label: 'Stale 30+ days', impact: 'negative', detail: `No activity for ${Math.round(daysSinceUpdate)} days` })
  } else if (daysSinceUpdate > 14) {
    score -= 10
    factors.push({ key: 'stale_14d', label: 'Stale 14+ days', impact: 'negative', detail: `No activity for ${Math.round(daysSinceUpdate)} days` })
  } else {
    factors.push({ key: 'recent_activity', label: 'Recent activity', impact: 'positive', detail: `Updated ${Math.round(daysSinceUpdate)} days ago` })
  }

  // ── Probability score ─────────────────────────────────────────────────────
  if (deal.probability >= 70) {
    score += 10
    factors.push({ key: 'high_probability', label: 'High win probability', impact: 'positive', detail: `${deal.probability}% probability` })
  } else if (deal.probability < 30) {
    score -= 15
    factors.push({ key: 'low_probability', label: 'Low win probability', impact: 'negative', detail: `${deal.probability}% probability` })
  }

  // ── Close date pressure ───────────────────────────────────────────────────
  if (daysUntilClose !== null) {
    if (daysUntilClose < 0) {
      score -= 20
      factors.push({ key: 'overdue', label: 'Close date passed', impact: 'negative', detail: `Expected close ${Math.abs(Math.round(daysUntilClose))} days ago` })
    } else if (daysUntilClose < 7) {
      score += 5
      factors.push({ key: 'closing_soon', label: 'Closing in <7 days', impact: 'positive', detail: `${Math.round(daysUntilClose)} days until expected close` })
    }
  } else {
    score -= 5
    factors.push({ key: 'no_close_date', label: 'No close date set', impact: 'negative', detail: 'Expected close date not configured' })
  }

  // ── Stage bonuses ─────────────────────────────────────────────────────────
  const lateStages = ['proposal', 'negotiation', 'contract', 'closed_won']
  if (lateStages.includes(deal.stage)) {
    score += 5
    factors.push({ key: 'late_stage', label: 'Late stage deal', impact: 'positive', detail: `Stage: ${deal.stage}` })
  }
  if (deal.stage === 'closed_won') {
    score = 100
    factors.push({ key: 'won', label: 'Deal won', impact: 'positive', detail: 'Deal has been closed-won' })
  }
  if (deal.stage === 'closed_lost') {
    score = 0
    factors.push({ key: 'lost', label: 'Deal lost', impact: 'negative', detail: 'Deal has been closed-lost' })
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), factors }
}

/**
 * GET /api/v1/revenue/deal-health/[id]
 *
 * Returns a rule-based deal health score (0–100) plus risk signal explanations.
 * Feature gate: m1_revenue_intelligence
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')

    const deal = await prisma.deal.findFirst({
      where: { id: params.id, tenantId },
      select: {
        id: true,
        name: true,
        stage: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
        actualCloseDate: true,
        updatedAt: true,
        assignedToId: true,
        contact: { select: { id: true, name: true, source: true } },
      },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found', id: params.id }, { status: 404 })
    }

    const { score, factors } = computeHealthScore(deal)

    const healthLabel =
      score >= 75 ? 'healthy'
      : score >= 50 ? 'at_risk'
      : 'critical'

    return NextResponse.json({
      deal_id: deal.id,
      deal_name: deal.name,
      stage: deal.stage,
      value: deal.value,
      probability: deal.probability,
      health_score: score,
      health_label: healthLabel,
      risk_factors: factors,
      computed_at: new Date().toISOString(),
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('Deal health error:', e)
    return NextResponse.json({ error: 'Failed to compute deal health' }, { status: 500 })
  }
}
