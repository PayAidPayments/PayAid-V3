import { prisma } from '@/lib/db/prisma'
import { formatINRStandard } from '@/lib/utils/formatINR'
import { REVENUE_FUNNEL_STAGE_ORDER } from '@/lib/ai-native/m1-revenue'
import type { RevenueFeedbackBody } from '@/lib/ai-native/m1-revenue'

function monthStartUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0))
}

function daysBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null
  const s = [...nums].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

export async function getRevenueFunnel(tenantId: string) {
  const now = new Date()
  const thirtyAgo = new Date(now)
  thirtyAgo.setDate(thirtyAgo.getDate() - 30)
  const sixtyAgo = new Date(now)
  sixtyAgo.setDate(sixtyAgo.getDate() - 60)

  const [openDeals, wonRecent, wonPrev30] = await Promise.all([
    prisma.deal.findMany({
      where: { tenantId, stage: { notIn: ['won', 'lost'] } },
      select: { stage: true, value: true },
    }),
    prisma.deal.findMany({
      where: {
        tenantId,
        stage: 'won',
        OR: [{ actualCloseDate: { gte: thirtyAgo } }, { actualCloseDate: null, updatedAt: { gte: thirtyAgo } }],
      },
      select: { value: true },
    }),
    prisma.deal.findMany({
      where: {
        tenantId,
        stage: 'won',
        OR: [
          { actualCloseDate: { gte: sixtyAgo, lt: thirtyAgo } },
          { actualCloseDate: null, updatedAt: { gte: sixtyAgo, lt: thirtyAgo } },
        ],
      },
      select: { value: true },
    }),
  ])

  const stageMap = new Map<string, { count: number; value: number }>()
  for (const d of openDeals) {
    const st = (d.stage || 'lead').toLowerCase()
    const cur = stageMap.get(st) ?? { count: 0, value: 0 }
    cur.count += 1
    cur.value += d.value || 0
    stageMap.set(st, cur)
  }

  const openPipeline = openDeals.reduce((s, d) => s + (d.value || 0), 0)

  const stages: Array<{
    stage: string
    deal_count: number
    total_value_inr: number
    percent_of_open_pipeline?: number
  }> = []
  const used = new Set<string>()

  for (const canonical of REVENUE_FUNNEL_STAGE_ORDER) {
    const row = stageMap.get(canonical)
    if (!row) continue
    used.add(canonical)
    stages.push({
      stage: canonical,
      deal_count: row.count,
      total_value_inr: row.value,
      percent_of_open_pipeline: openPipeline > 0 ? row.value / openPipeline : 0,
    })
  }

  for (const [st, row] of stageMap) {
    if (used.has(st)) continue
    stages.push({
      stage: st,
      deal_count: row.count,
      total_value_inr: row.value,
      percent_of_open_pipeline: openPipeline > 0 ? row.value / openPipeline : 0,
    })
  }

  const closedWonValue = wonRecent.reduce((s, d) => s + (d.value || 0), 0)
  const closedWonPrevValue = wonPrev30.reduce((s, d) => s + (d.value || 0), 0)

  return {
    schema_version: '1.0' as const,
    tenant_id: tenantId,
    as_of: now.toISOString(),
    stages,
    open_deal_count: openDeals.length,
    open_pipeline_value_inr: openPipeline,
    closed_won_count_30d: wonRecent.length,
    closed_won_value_inr_30d: closedWonValue,
    closed_won_count_prev_30d: wonPrev30.length,
    closed_won_value_inr_prev_30d: closedWonPrevValue,
  }
}

export async function getRevenueVelocity(tenantId: string, windowDays: number) {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - windowDays)

  const [openDeals, wonInWindow] = await Promise.all([
    prisma.deal.findMany({
      where: { tenantId, stage: { notIn: ['won', 'lost'] } },
      select: { stage: true, createdAt: true },
    }),
    prisma.deal.findMany({
      where: {
        tenantId,
        stage: 'won',
        OR: [{ actualCloseDate: { gte: windowStart } }, { actualCloseDate: null, updatedAt: { gte: windowStart } }],
      },
      select: { value: true },
    }),
  ])

  const ages = openDeals.map((d) => daysBetween(d.createdAt, now))
  const byStageMap = new Map<string, number[]>()
  for (const d of openDeals) {
    const st = (d.stage || 'lead').toLowerCase()
    const age = daysBetween(d.createdAt, now)
    const arr = byStageMap.get(st) ?? []
    arr.push(age)
    byStageMap.set(st, arr)
  }

  const by_stage = [...byStageMap.entries()].map(([stage, arr]) => ({
    stage,
    deal_count: arr.length,
    avg_days_since_created: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null,
    median_days_since_created: median(arr),
  }))

  const wonTotal = wonInWindow.reduce((s, d) => s + (d.value || 0), 0)

  return {
    schema_version: '1.0' as const,
    tenant_id: tenantId,
    window_days: windowDays,
    as_of: now.toISOString(),
    avg_days_open_deal_age: ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
    median_days_open_deal_age: median(ages),
    by_stage,
    won_deals_in_window: {
      count: wonInWindow.length,
      total_value_inr: wonTotal,
    },
  }
}

export async function getRevenueNextActions(tenantId: string, limit: number) {
  const now = new Date()

  const deals = await prisma.deal.findMany({
    where: { tenantId, stage: { notIn: ['won', 'lost'] } },
    select: {
      id: true,
      name: true,
      stage: true,
      value: true,
      updatedAt: true,
    },
    orderBy: [{ value: 'desc' }, { updatedAt: 'asc' }],
    take: Math.min(Math.max(limit * 4, 20), 100),
  })

  const cap = Math.min(Math.max(limit, 1), 25)
  const recommendations = deals.slice(0, cap).map((d) => {
    const daysSinceTouch = daysBetween(d.updatedAt, now)
    const staleRisk = daysSinceTouch > 14 ? 0.5 : daysSinceTouch > 7 ? 0.35 : 0.2
    const valueRisk = d.value >= 500000 ? 0.3 : d.value >= 100000 ? 0.15 : 0.05
    const risk = Math.min(1, staleRisk + valueRisk)
    const st = (d.stage || 'lead').toLowerCase()
    let suggested_action: 'follow_up' | 're_qualify' | 'advance_stage' | 'review_pricing' = 'follow_up'
    if (st === 'negotiation') suggested_action = 'review_pricing'
    else if (st === 'lead') suggested_action = 're_qualify'
    else if (st === 'proposal') suggested_action = 'advance_stage'

    const valueLabel = formatINRStandard(d.value)
    const rationale =
      daysSinceTouch > 7
        ? `No recorded update in ${Math.round(daysSinceTouch)} days; open value ${valueLabel}`
        : `Open deal ${valueLabel} in stage ${d.stage}`

    return {
      id: `rec_${d.id}`,
      deal_id: d.id,
      deal_name: d.name,
      stage: d.stage,
      value_inr: d.value,
      risk_score: Math.round(risk * 100) / 100,
      recommendation_rationale: rationale,
      suggested_action,
    }
  })

  return {
    schema_version: '1.0' as const,
    tenant_id: tenantId,
    as_of: now.toISOString(),
    recommendations,
  }
}

/**
 * Closed-won time series by month for the last N months (UTC month buckets).
 * Uses `actualCloseDate` when present; falls back to `updatedAt` for legacy rows.
 */
export async function getRevenueWonTimeseries(tenantId: string, months: number) {
  const now = new Date()
  const capped = Math.min(Math.max(Math.floor(months), 1), 24)
  const start = monthStartUtc(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (capped - 1), 1)))

  const won = await prisma.deal.findMany({
    where: {
      tenantId,
      stage: 'won',
      OR: [{ actualCloseDate: { gte: start } }, { actualCloseDate: null, updatedAt: { gte: start } }],
    },
    select: { value: true, actualCloseDate: true, updatedAt: true },
  })

  const buckets = new Map<number, { count: number; value: number }>()
  for (let i = 0; i < capped; i++) {
    const ms = monthStartUtc(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))).getTime()
    buckets.set(ms, { count: 0, value: 0 })
  }

  for (const d of won) {
    const close = d.actualCloseDate ?? d.updatedAt
    const m = monthStartUtc(close).getTime()
    const b = buckets.get(m)
    if (!b) continue
    b.count += 1
    b.value += d.value || 0
  }

  const points = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ms, b]) => ({
      month_start: new Date(ms).toISOString(),
      won_deal_count: b.count,
      won_value_inr: b.value,
    }))

  return {
    schema_version: '1.0' as const,
    tenant_id: tenantId,
    as_of: now.toISOString(),
    months: capped,
    points,
  }
}

/** Dedupes on `idempotencyKey` (same as `x-idempotency-key`). */
export async function persistRevenueFeedback(
  tenantId: string,
  userId: string,
  idempotencyKey: string,
  body: RevenueFeedbackBody
) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId,
      entityType: 'revenue_feedback',
      entityId: idempotencyKey,
    },
    select: { id: true, afterSnapshot: true, timestamp: true },
  })
  if (existing) {
    return { deduplicated: true as const, audit: existing }
  }
  const audit = await prisma.auditLog.create({
    data: {
      tenantId,
      entityType: 'revenue_feedback',
      entityId: idempotencyKey,
      changedBy: userId,
      changeSummary: `Revenue insight ${body.accepted ? 'accepted' : 'rejected'} (deal ${body.deal_id})`,
      afterSnapshot: { ...body, recommendation_id: body.recommendation_id, recorded_at: new Date().toISOString() },
    },
    select: { id: true, afterSnapshot: true, timestamp: true },
  })
  return { deduplicated: false as const, audit }
}
