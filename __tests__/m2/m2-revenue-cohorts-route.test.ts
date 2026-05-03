/**
 * M3 smoke — GET /api/v1/revenue/cohorts
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getCohorts } from '@/apps/dashboard/app/api/v1/revenue/cohorts/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(msg: string) { super(msg) }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: { findMany: jest.fn() },
  },
}))

function makeReq(qs = '') {
  return new NextRequest(`http://localhost/api/v1/revenue/cohorts${qs}`, {
    headers: { authorization: 'Bearer t' },
  })
}

const MOCK_DEALS = [
  { id: 'd1', stage: 'closed_won', value: 50_000, assignedToId: 'rep1', contact: { source: 'inbound' } },
  { id: 'd2', stage: 'closed_lost', value: 75_000, assignedToId: 'rep1', contact: { source: 'outbound' } },
  { id: 'd3', stage: 'closed_won', value: 300_000, assignedToId: 'rep2', contact: { source: 'inbound' } },
  { id: 'd4', stage: 'closed_won', value: 1_200_000, assignedToId: null, contact: null },
  { id: 'd5', stage: 'closed_lost', value: 4_000_000, assignedToId: 'rep2', contact: { source: 'referral' } },
]

describe('GET /api/v1/revenue/cohorts (M3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    auth.handleLicenseError.mockReturnValue(null)
    db.prisma.deal.findMany.mockResolvedValue(MOCK_DEALS)
  })

  it('returns 200 with size cohorts by default', async () => {
    const res = await getCohorts(makeReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.group_by).toBe('size')
    expect(json.window_days).toBe(90)
    expect(Array.isArray(json.cohorts)).toBe(true)
    expect(json.total_closed_in_window).toBe(5)
    expect(json.total_won_in_window).toBe(3)
  })

  it('groups by rep when ?group_by=rep', async () => {
    const res = await getCohorts(makeReq('?group_by=rep'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.group_by).toBe('rep')
    const keys = json.cohorts.map((c: { key: string }) => c.key)
    expect(keys).toContain('rep1')
    expect(keys).toContain('rep2')
    expect(keys).toContain('unassigned')
  })

  it('groups by source when ?group_by=source', async () => {
    const res = await getCohorts(makeReq('?group_by=source'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.group_by).toBe('source')
    const keys = json.cohorts.map((c: { key: string }) => c.key)
    expect(keys).toContain('inbound')
    expect(keys).toContain('outbound')
    expect(keys).toContain('referral')
  })

  it('includes win_rate_pct and avg_deal_value per cohort', async () => {
    const res = await getCohorts(makeReq('?group_by=size'))
    expect(res.status).toBe(200)
    const json = await res.json()
    for (const cohort of json.cohorts) {
      expect(typeof cohort.win_rate_pct === 'number' || cohort.win_rate_pct === null).toBe(true)
      expect(typeof cohort.avg_deal_value === 'number' || cohort.avg_deal_value === null).toBe(true)
      expect(cohort.total_closed).toBeGreaterThanOrEqual(0)
    }
  })

  it('caps window_days at 365', async () => {
    const res = await getCohorts(makeReq('?window_days=999'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.window_days).toBe(365)
  })

  it('falls back to size grouping for unknown group_by value', async () => {
    const res = await getCohorts(makeReq('?group_by=invalid_dim'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.group_by).toBe('size')
  })

  it('returns 200 with empty cohorts when no closed deals exist', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue([])
    const res = await getCohorts(makeReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.cohorts).toHaveLength(0)
    expect(json.total_closed_in_window).toBe(0)
  })

  it('returns 403 FEATURE_DISABLED when flag off', async () => {
    const ff = require('@/lib/feature-flags/tenant-feature')
    ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
      new ff.TenantFeatureDisabledError('Feature m1_revenue_intelligence is disabled')
    )
    const res = await getCohorts(makeReq())
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('FEATURE_DISABLED')
  })

  it('returns 500 on unexpected error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockRejectedValue(new Error('DB timeout'))
    const res = await getCohorts(makeReq())
    expect(res.status).toBe(500)
  })
})
