/**
 * M3 smoke — GET /api/v1/revenue/deal-health/[id]
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getDealHealth } from '@/apps/dashboard/app/api/v1/revenue/deal-health/[id]/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn(),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(msg: string) { super(msg) }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: { findFirst: jest.fn() },
  },
}))

const RECENT_DATE = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
const FUTURE_DATE = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
const PAST_DATE = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40 days ago

const SAMPLE_DEAL = {
  id: 'deal_1',
  name: 'Acme Enterprise Deal',
  stage: 'negotiation',
  value: 500000,
  probability: 75,
  expectedCloseDate: FUTURE_DATE,
  actualCloseDate: null,
  updatedAt: RECENT_DATE,
  assignedToId: 'rep_1',
  contact: { id: 'con_1', name: 'Priya Sharma', source: 'website' },
}

function makeReq(id: string) {
  return new NextRequest(`http://localhost/api/v1/revenue/deal-health/${id}`, {
    headers: { authorization: 'Bearer t' },
  })
}

describe('GET /api/v1/revenue/deal-health/[id] (M3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const ff = require('@/lib/feature-flags/tenant-feature')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    auth.handleLicenseError.mockReturnValue(null)
    ff.assertTenantFeatureEnabled.mockResolvedValue(undefined)
    db.prisma.deal.findFirst.mockResolvedValue(SAMPLE_DEAL)
  })

  it('returns 200 with health score and factors for a healthy deal', async () => {
    const res = await getDealHealth(makeReq('deal_1'), { params: { id: 'deal_1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.deal_id).toBe('deal_1')
    expect(json.health_score).toBeGreaterThan(0)
    expect(json.health_score).toBeLessThanOrEqual(100)
    expect(Array.isArray(json.risk_factors)).toBe(true)
    expect(json.health_label).toBe('healthy')
  })

  it('returns health_label=critical for a stale, low-probability deal', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findFirst.mockResolvedValue({
      ...SAMPLE_DEAL,
      probability: 15,
      updatedAt: PAST_DATE, // 40 days stale
      expectedCloseDate: PAST_DATE, // overdue
    })
    const res = await getDealHealth(makeReq('deal_1'), { params: { id: 'deal_1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.health_score).toBeLessThan(50)
    expect(json.health_label).toBe('critical')
  })

  it('returns health_score=100 for closed_won deal', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findFirst.mockResolvedValue({
      ...SAMPLE_DEAL,
      stage: 'closed_won',
      actualCloseDate: RECENT_DATE,
    })
    const res = await getDealHealth(makeReq('deal_1'), { params: { id: 'deal_1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.health_score).toBe(100)
  })

  it('returns health_score=0 for closed_lost deal', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findFirst.mockResolvedValue({
      ...SAMPLE_DEAL,
      stage: 'closed_lost',
    })
    const res = await getDealHealth(makeReq('deal_1'), { params: { id: 'deal_1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.health_score).toBe(0)
  })

  it('returns 404 when deal does not exist', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findFirst.mockResolvedValue(null)
    const res = await getDealHealth(makeReq('nonexistent'), { params: { id: 'nonexistent' } })
    expect(res.status).toBe(404)
  })

  it('returns 403 FEATURE_DISABLED when m1_revenue_intelligence is off', async () => {
    const ff = require('@/lib/feature-flags/tenant-feature')
    ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
      new ff.TenantFeatureDisabledError('m1_revenue_intelligence not enabled')
    )
    const res = await getDealHealth(makeReq('deal_1'), { params: { id: 'deal_1' } })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('FEATURE_DISABLED')
  })

  it('includes overdue risk factor for past expected close date', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findFirst.mockResolvedValue({
      ...SAMPLE_DEAL,
      expectedCloseDate: PAST_DATE,
    })
    const res = await getDealHealth(makeReq('deal_1'), { params: { id: 'deal_1' } })
    const json = await res.json()
    const overdue = json.risk_factors.find((f: { key: string }) => f.key === 'overdue')
    expect(overdue).toBeDefined()
    expect(overdue.impact).toBe('negative')
  })

  it('returns 500 on unexpected DB error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findFirst.mockRejectedValue(new Error('DB error'))
    const res = await getDealHealth(makeReq('deal_1'), { params: { id: 'deal_1' } })
    expect(res.status).toBe(500)
  })
})
