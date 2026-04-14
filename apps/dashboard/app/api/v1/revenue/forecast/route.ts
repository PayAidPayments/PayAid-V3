import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled } from '@/lib/feature-flags/tenant-feature'

/**
 * GET /api/v1/revenue/forecast
 *
 * Probability-weighted pipeline revenue forecast.
 *
 * Algorithm:
 *   For each open deal:
 *     weighted_value = deal.value * (deal.probability / 100)
 *
 *   Buckets by expected close date:
 *     - this_month:  closes within current calendar month
 *     - next_month:  closes in following calendar month
 *     - this_quarter: closes within current quarter (not already in above)
 *     - beyond:       everything else (or no close date)
 *
 *   Summary:
 *     - best_case:    sum of full deal values (probability = 100%)
 *     - commit:       deals with probability >= 70% (weighted)
 *     - most_likely:  all open deals probability-weighted
 *     - pipeline_gap: commit target (optional, supplied via ?target_inr=) − commit
 *
 * Feature gate: m1_revenue_intelligence
 *
 * Query params:
 *   ?window_days=  Look-ahead window in days (default: 90, max: 365)
 *   ?target_inr=   Optional monthly revenue commit target in INR
 */

type ForecastBucket = {
  label: string
  period: string
  deal_count: number
  best_case_inr: number
  most_likely_inr: number
  commit_inr: number
  deals: Array<{
    deal_id: string
    deal_name: string
    stage: string
    value: number
    probability: number
    weighted_value: number
    expected_close: string | null
  }>
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')

    const sp = request.nextUrl.searchParams
    const windowDays = Math.min(parseInt(sp.get('window_days') ?? '90'), 365)
    const targetInr = sp.get('target_inr') ? Number(sp.get('target_inr')) : null

    const horizon = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000)
    const now = new Date()

    // Calendar helpers
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3
    const thisQuarterEnd = new Date(now.getFullYear(), quarterMonth + 3, 0)

    const openDeals = await prisma.deal.findMany({
      where: {
        tenantId,
        stage: { notIn: ['closed_won', 'closed_lost'] },
        OR: [
          { expectedCloseDate: { lte: horizon } },
          { expectedCloseDate: null },
        ],
      },
      select: {
        id: true,
        name: true,
        stage: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
      },
      orderBy: [{ probability: 'desc' }, { value: 'desc' }],
    })

    // Build buckets
    const bucketsMap: Record<string, ForecastBucket> = {
      this_month: {
        label: 'This month',
        period: `${thisMonthStart.toISOString().slice(0, 10)} – ${thisMonthEnd.toISOString().slice(0, 10)}`,
        deal_count: 0, best_case_inr: 0, most_likely_inr: 0, commit_inr: 0, deals: [],
      },
      next_month: {
        label: 'Next month',
        period: `${nextMonthStart.toISOString().slice(0, 10)} – ${nextMonthEnd.toISOString().slice(0, 10)}`,
        deal_count: 0, best_case_inr: 0, most_likely_inr: 0, commit_inr: 0, deals: [],
      },
      this_quarter: {
        label: 'This quarter',
        period: `${thisMonthStart.toISOString().slice(0, 10)} – ${thisQuarterEnd.toISOString().slice(0, 10)}`,
        deal_count: 0, best_case_inr: 0, most_likely_inr: 0, commit_inr: 0, deals: [],
      },
      beyond: {
        label: 'Beyond',
        period: `${new Date(thisQuarterEnd.getTime() + 86400000).toISOString().slice(0, 10)} – ${horizon.toISOString().slice(0, 10)}`,
        deal_count: 0, best_case_inr: 0, most_likely_inr: 0, commit_inr: 0, deals: [],
      },
    }

    let totalBestCase = 0
    let totalMostLikely = 0
    let totalCommit = 0

    for (const deal of openDeals) {
      const val = Number(deal.value ?? 0)
      const prob = Number(deal.probability ?? 50)
      const weighted = Math.round((val * prob) / 100)
      const isCommit = prob >= 70

      const closeDate = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null

      let bucketKey: string
      if (!closeDate) {
        bucketKey = 'beyond'
      } else if (closeDate <= thisMonthEnd && closeDate >= thisMonthStart) {
        bucketKey = 'this_month'
      } else if (closeDate >= nextMonthStart && closeDate <= nextMonthEnd) {
        bucketKey = 'next_month'
      } else if (closeDate <= thisQuarterEnd) {
        bucketKey = 'this_quarter'
      } else {
        bucketKey = 'beyond'
      }

      const bucket = bucketsMap[bucketKey]
      bucket.deal_count += 1
      bucket.best_case_inr += val
      bucket.most_likely_inr += weighted
      if (isCommit) bucket.commit_inr += weighted
      bucket.deals.push({
        deal_id: deal.id,
        deal_name: deal.name,
        stage: deal.stage,
        value: val,
        probability: prob,
        weighted_value: weighted,
        expected_close: closeDate ? closeDate.toISOString().slice(0, 10) : null,
      })

      totalBestCase += val
      totalMostLikely += weighted
      if (isCommit) totalCommit += weighted
    }

    const pipelineGap = targetInr != null ? Math.max(0, targetInr - totalCommit) : null

    return NextResponse.json({
      schema_version: 1,
      window_days: windowDays,
      target_inr: targetInr,
      summary: {
        total_open_deals: openDeals.length,
        best_case_inr: totalBestCase,
        most_likely_inr: totalMostLikely,
        commit_inr: totalCommit,
        pipeline_gap_inr: pipelineGap,
      },
      buckets: Object.values(bucketsMap),
      generated_at: now.toISOString(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'FEATURE_DISABLED' || (error as { code?: string })?.code === 'FEATURE_DISABLED') {
      return NextResponse.json({ error: 'Feature disabled', code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    console.error('Revenue forecast error:', error)
    return NextResponse.json({ error: 'Failed to compute revenue forecast' }, { status: 500 })
  }
}
