/**
 * M3 smoke — POST /api/v1/revenue/deal-health/batch
 *
 * Returns health scores for up to 50 deals in a single request.
 * Feature gate: m1_revenue_intelligence.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as batchDealHealth } from '@/apps/dashboard/app/api/v1/revenue/deal-health/batch/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn(),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'TenantFeatureDisabledError'
    }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: { findMany: jest.fn() },
  },
}))

const NOW = new Date()
const RECENT = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
const FUTURE = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)

const SAMPLE_DEALS = [
  {
    id: 'deal_1',
    name: 'Acme Deal',
    stage: 'negotiation',
    value: 500000,
    probability: 75,
    expectedCloseDate: FUTURE,
    actualCloseDate: null,
    updatedAt: RECENT,
  },
  {
    id: 'deal_2',
    name: 'Stale Deal',
    stage: 'lead',
    value: 100000,
    probability: 25,
    expectedCloseDate: null,
    actualCloseDate: null,
    updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days stale
  },
  {
    id: 'deal_3',
    name: 'Won Deal',
    stage: 'closed_won',
    value: 200000,
    probability: 100,
    expectedCloseDate: RECENT,
    actualCloseDate: RECENT,
    updatedAt: RECENT,
  },
]

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/v1/revenue/deal-health/batch', {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/revenue/deal-health/batch (M3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const flags = require('@/lib/feature-flags/tenant-feature')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m3' })
    flags.assertTenantFeatureEnabled.mockResolvedValue(undefined)
  })

  it('returns 200 with health scores for all found deals', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue(SAMPLE_DEALS)

    const req = makeReq({ deal_ids: ['deal_1', 'deal_2', 'deal_3'] })
    const res = await batchDealHealth(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.results).toHaveLength(3)
    expect(body.found).toBe(3)
    expect(body.requested).toBe(3)
    expect(body.results[0].deal_id).toBe('deal_1')
    expect(typeof body.results[0].health_score).toBe('number')
    expect(['healthy', 'at_risk', 'critical']).toContain(body.results[0].health_label)
  })

  it('assigns health_score=100 and health_label=healthy to closed_won deals', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue([SAMPLE_DEALS[2]])

    const req = makeReq({ deal_ids: ['deal_3'] })
    const res = await batchDealHealth(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    const result = body.results[0]
    expect(result.health_score).toBe(100)
    expect(result.health_label).toBe('healthy')
  })

  it('assigns health_score=0 and health_label=critical to stale low-probability deal', async () => {
    const db = require('@/lib/db/prisma')
    const staleDeal = {
      ...SAMPLE_DEALS[1],
      stage: 'closed_lost',
    }
    db.prisma.deal.findMany.mockResolvedValue([staleDeal])

    const req = makeReq({ deal_ids: ['deal_2'] })
    const res = await batchDealHealth(req)
    const body = await res.json()

    expect(body.results[0].health_score).toBe(0)
    expect(body.results[0].health_label).toBe('critical')
  })

  it('preserves original request order in results', async () => {
    const db = require('@/lib/db/prisma')
    // Return in reverse order from DB
    db.prisma.deal.findMany.mockResolvedValue([SAMPLE_DEALS[1], SAMPLE_DEALS[0]])

    const req = makeReq({ deal_ids: ['deal_1', 'deal_2'] })
    const res = await batchDealHealth(req)
    const body = await res.json()

    // Results should match request order, not DB return order
    expect(body.results[0].deal_id).toBe('deal_1')
    expect(body.results[1].deal_id).toBe('deal_2')
  })

  it('returns 400 when deal_ids is empty', async () => {
    const req = makeReq({ deal_ids: [] })
    const res = await batchDealHealth(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 400 when deal_ids exceeds 50', async () => {
    const req = makeReq({ deal_ids: Array.from({ length: 51 }, (_, i) => `deal_${i}`) })
    const res = await batchDealHealth(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 403 FEATURE_DISABLED when m1_revenue_intelligence is off', async () => {
    const flags = require('@/lib/feature-flags/tenant-feature')
    flags.assertTenantFeatureEnabled.mockRejectedValue(
      new flags.TenantFeatureDisabledError('m1_revenue_intelligence is disabled'),
    )

    const req = makeReq({ deal_ids: ['deal_1'] })
    const res = await batchDealHealth(req)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
  })

  it('returns 500 on unexpected DB error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockRejectedValue(new Error('db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = makeReq({ deal_ids: ['deal_1'] })
    const res = await batchDealHealth(req)

    expect(res.status).toBe(500)
    spy.mockRestore()
  })
})
