import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

type GroupBy = 'rep' | 'size' | 'source'

const VALID_GROUP_BY: GroupBy[] = ['rep', 'size', 'source']
const CLOSED_STAGES = ['closed_won', 'closed_lost']
const WON_STAGE = 'closed_won'

/** Size bucket thresholds (INR) */
const SIZE_BUCKETS = [
  { key: 'small', label: 'Small (< ₹1L)', max: 100_000 },
  { key: 'mid', label: 'Mid (₹1L–5L)', max: 500_000 },
  { key: 'large', label: 'Large (₹5L–25L)', max: 2_500_000 },
  { key: 'enterprise', label: 'Enterprise (> ₹25L)', max: Infinity },
]

function getSizeBucket(value: number): { key: string; label: string } {
  for (const b of SIZE_BUCKETS) {
    if (value < b.max) return { key: b.key, label: b.label }
  }
  return SIZE_BUCKETS[SIZE_BUCKETS.length - 1]
}

/**
 * GET /api/v1/revenue/cohorts
 *
 * Win-rate matrix grouped by rep | size | source.
 *
 * Query params:
 *   ?group_by=rep|size|source  (default: size)
 *   ?window_days=30|90|365     (default: 90, max: 365)
 *
 * Feature gate: m1_revenue_intelligence
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')

    const url = new URL(request.url)
    const rawGroupBy = url.searchParams.get('group_by') ?? 'size'
    const groupBy: GroupBy = VALID_GROUP_BY.includes(rawGroupBy as GroupBy)
      ? (rawGroupBy as GroupBy)
      : 'size'
    const windowDays = Math.min(
      parseInt(url.searchParams.get('window_days') ?? '90', 10),
      365
    )
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

    // Fetch all closed deals in window with the fields needed for grouping
    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        stage: { in: CLOSED_STAGES },
        updatedAt: { gte: since },
      },
      select: {
        id: true,
        stage: true,
        value: true,
        assignedToId: true,
        contact: { select: { source: true } },
      },
    })

    // Accumulate cohort buckets
    type Bucket = {
      key: string
      label: string
      total_closed: number
      won: number
      lost: number
      total_value: number
    }

    const buckets = new Map<string, Bucket>()

    for (const deal of deals) {
      let key: string
      let label: string

      if (groupBy === 'rep') {
        key = deal.assignedToId ?? 'unassigned'
        label = deal.assignedToId ? `Rep ${deal.assignedToId.slice(-6)}` : 'Unassigned'
      } else if (groupBy === 'size') {
        const b = getSizeBucket(deal.value)
        key = b.key
        label = b.label
      } else {
        // source
        key = deal.contact?.source ?? 'unknown'
        label = deal.contact?.source ?? 'Unknown'
      }

      const existing = buckets.get(key) ?? {
        key,
        label,
        total_closed: 0,
        won: 0,
        lost: 0,
        total_value: 0,
      }
      existing.total_closed += 1
      existing.total_value += deal.value
      if (deal.stage === WON_STAGE) existing.won += 1
      else existing.lost += 1
      buckets.set(key, existing)
    }

    // Sort buckets by size order (for size grouping) or by won desc (others)
    const cohorts = Array.from(buckets.values())
      .map((b) => ({
        key: b.key,
        label: b.label,
        total_closed: b.total_closed,
        won: b.won,
        lost: b.lost,
        win_rate_pct:
          b.total_closed > 0
            ? parseFloat(((b.won / b.total_closed) * 100).toFixed(1))
            : null,
        total_value: b.total_value,
        avg_deal_value:
          b.total_closed > 0
            ? Math.round(b.total_value / b.total_closed)
            : null,
      }))
      .sort((a, b) => {
        if (groupBy === 'size') {
          const order = ['small', 'mid', 'large', 'enterprise']
          return order.indexOf(a.key) - order.indexOf(b.key)
        }
        return (b.won ?? 0) - (a.won ?? 0)
      })

    return NextResponse.json({
      group_by: groupBy,
      window_days: windowDays,
      since: since.toISOString(),
      total_closed_in_window: deals.length,
      total_won_in_window: deals.filter((d) => d.stage === WON_STAGE).length,
      cohorts,
      generated_at: new Date().toISOString(),
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('Revenue cohorts error:', e)
    return NextResponse.json({ error: 'Failed to compute revenue cohorts' }, { status: 500 })
  }
}
