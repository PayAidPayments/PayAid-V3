/**
 * M3.1 smoke â€” Revenue Forecast
 *   GET /api/v1/revenue/forecast
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getForecast } from '@/apps/dashboard/app/api/v1/revenue/forecast/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn(),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    code = 'FEATURE_DISABLED'
    constructor(msg = 'FEATURE_DISABLED') { super(msg) }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: { findMany: jest.fn() },
  },
}))

// Keep close dates deterministic across month-end boundaries.
const NOW = new Date()
const thisMonthClose = new Date(NOW.getFullYear(), NOW.getMonth(), 2)
const farClose = new Date(NOW.getFullYear(), NOW.getMonth() + 4, 10) // beyond quarter

const SAMPLE_DEALS = [
  {
    id: 'deal_1',
    name: 'Big Corp Deal',
    stage: 'proposal',
    value: 500000,
    probability: 80,
    expectedCloseDate: thisMonthClose,
  },
  {
    id: 'deal_2',
    name: 'Mid Deal',
    stage: 'negotiation',
    value: 200000,
    probability: 50,
    expectedCloseDate: thisMonthClose,
  },
  {
    id: 'deal_3',
    name: 'Far Pipeline',
    stage: 'discovery',
    value: 300000,
    probability: 30,
    expectedCloseDate: farClose,
  },
]

function makeReq(qs = '') {
  return new NextRequest(`http://localhost/api/v1/revenue/forecast${qs}`, {
    headers: { cookie: 'token=crm.user.jwt' },
  })
}

describe('GET /api/v1/revenue/forecast (M3.1 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_crm', userId: 'usr_1' })
    const flags = require('@/lib/feature-flags/tenant-feature')
    flags.assertTenantFeatureEnabled.mockResolvedValue(undefined)
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue(SAMPLE_DEALS)
  })

  it('200 â€” returns summary with best_case, most_likely, commit totals', async () => {
    const req = makeReq()
    const res = await getForecast(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary.total_open_deals).toBe(3)
    // best_case = sum of all values
    expect(body.summary.best_case_inr).toBe(500000 + 200000 + 300000)
    // most_likely = probability-weighted sum
    const expectedMostLikely = Math.round(500000 * 0.8) + Math.round(200000 * 0.5) + Math.round(300000 * 0.3)
    expect(body.summary.most_likely_inr).toBe(expectedMostLikely)
  })

  it('200 â€” commit includes only deals with probability >= 70%', async () => {
    const req = makeReq()
    const res = await getForecast(req)
    const body = await res.json()
    // Only deal_1 (80%) qualifies for commit
    expect(body.summary.commit_inr).toBe(Math.round(500000 * 0.8))
  })

  it('200 â€” deals are bucketed by close date', async () => {
    const req = makeReq()
    const res = await getForecast(req)
    const body = await res.json()
    expect(Array.isArray(body.buckets)).toBe(true)
    const thisMonth = body.buckets.find((b: { label: string }) => b.label === 'This month')
    expect(thisMonth).toBeDefined()
    // deal_1 and deal_2 close this month
    expect(thisMonth.deal_count).toBe(2)
  })

  it('200 â€” pipeline_gap computed when target_inr supplied', async () => {
    const req = makeReq('?target_inr=1000000')
    const res = await getForecast(req)
    const body = await res.json()
    expect(body.summary.pipeline_gap_inr).toBeGreaterThanOrEqual(0)
    expect(body.target_inr).toBe(1000000)
  })

  it('200 â€” pipeline_gap is null when no target supplied', async () => {
    const req = makeReq()
    const res = await getForecast(req)
    const body = await res.json()
    expect(body.summary.pipeline_gap_inr).toBeNull()
  })

  it('200 â€” empty pipeline returns zeros', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue([])
    const req = makeReq()
    const res = await getForecast(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary.total_open_deals).toBe(0)
    expect(body.summary.best_case_inr).toBe(0)
    expect(body.summary.most_likely_inr).toBe(0)
    expect(body.summary.commit_inr).toBe(0)
  })

  it('200 â€” window_days capped at 365', async () => {
    const req = makeReq('?window_days=9999')
    const res = await getForecast(req)
    const body = await res.json()
    expect(body.window_days).toBe(365)
  })

  it('403 â€” FEATURE_DISABLED when m1_revenue_intelligence is off', async () => {
    const flags = require('@/lib/feature-flags/tenant-feature')
    const { TenantFeatureDisabledError } = flags
    flags.assertTenantFeatureEnabled.mockRejectedValue(new TenantFeatureDisabledError())
    const req = makeReq()
    const res = await getForecast(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.code).toBe('FEATURE_DISABLED')
  })

  it('500 â€” DB error returns 500', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockRejectedValue(new Error('DB down'))
    const req = makeReq()
    const res = await getForecast(req)
    expect(res.status).toBe(500)
  })
})
