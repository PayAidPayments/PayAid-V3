/**
 * M3 smoke — GET /api/v1/revenue/ltv
 *
 * LTV (Lifetime Value) per contact, derived from closed-won deal history.
 * Feature gate: m1_revenue_intelligence.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getLTV } from '@/apps/dashboard/app/api/v1/revenue/ltv/route'

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

const NOW = Date.now()
const CLOSE_DATE_1 = new Date(NOW - 30 * 24 * 60 * 60 * 1000)  // 30 days ago
const CLOSE_DATE_2 = new Date(NOW - 120 * 24 * 60 * 60 * 1000) // 120 days ago

function makeReq(qs = '') {
  return new NextRequest(`http://localhost/api/v1/revenue/ltv${qs}`, {
    headers: { authorization: 'Bearer t' },
  })
}

function makeDeals(overrides: object[] = []) {
  const defaults = [
    {
      contactId: 'con_1',
      value: 500_000,
      actualCloseDate: CLOSE_DATE_1,
      contact: { id: 'con_1', firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com' },
    },
    {
      contactId: 'con_1',
      value: 300_000,
      actualCloseDate: CLOSE_DATE_2,
      contact: { id: 'con_1', firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com' },
    },
    {
      contactId: 'con_2',
      value: 200_000,
      actualCloseDate: CLOSE_DATE_1,
      contact: { id: 'con_2', firstName: 'Rohit', lastName: 'Kumar', email: 'rohit@example.com' },
    },
  ]
  return overrides.length ? overrides : defaults
}

describe('GET /api/v1/revenue/ltv (M3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const flags = require('@/lib/feature-flags/tenant-feature')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m3' })
    flags.assertTenantFeatureEnabled.mockResolvedValue(undefined)
  })

  it('returns 200 with correct schema and ranked contacts', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue(makeDeals())

    const res = await getLTV(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.schema_version).toBe('1.0')
    expect(body.window_days).toBe(365)
    expect(Array.isArray(body.contacts)).toBe(true)
    // con_1 has ₹8L total, con_2 has ₹2L — con_1 should rank first
    expect(body.contacts[0].contact_id).toBe('con_1')
    expect(body.contacts[0].total_deals).toBe(2)
    expect(body.contacts[0].total_value).toBe(800_000)
    expect(body.contacts[0].avg_deal_value).toBe(400_000)
    expect(body.contacts[1].contact_id).toBe('con_2')
  })

  it('computes predicted_annual_ltv for contacts with ≥90 days tenure', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue(makeDeals())

    const res = await getLTV(makeReq())
    const body = await res.json()

    const priya = body.contacts.find((c: { contact_id: string }) => c.contact_id === 'con_1')
    // tenure_days = 120 - 30 = 90 days exactly; ≥90 so annual LTV should be computed
    expect(priya.tenure_days).toBeGreaterThanOrEqual(85)
    expect(priya.predicted_annual_ltv).not.toBeNull()
    // Annual LTV ≈ 800_000 / tenure_days * 365
    expect(priya.predicted_annual_ltv).toBeGreaterThan(0)
  })

  it('excludes contacts with fewer deals than min_deals', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue(makeDeals())

    const res = await getLTV(makeReq('?min_deals=2'))
    const body = await res.json()

    // con_2 only has 1 deal so should be excluded
    expect(body.contacts.every((c: { contact_id: string }) => c.contact_id !== 'con_2')).toBe(true)
    expect(body.contacts.length).toBe(1)
    expect(body.contacts[0].contact_id).toBe('con_1')
  })

  it('caps window_days at 730', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue([])

    const res = await getLTV(makeReq('?window_days=9999'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.window_days).toBe(730)
  })

  it('returns empty contacts array when no closed-won deals', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockResolvedValue([])

    const res = await getLTV(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.contacts).toHaveLength(0)
    expect(body.total_contacts).toBe(0)
  })

  it('returns 403 FEATURE_DISABLED when m1_revenue_intelligence is off', async () => {
    const flags = require('@/lib/feature-flags/tenant-feature')
    flags.assertTenantFeatureEnabled.mockRejectedValue(
      new flags.TenantFeatureDisabledError('m1_revenue_intelligence is disabled'),
    )

    const res = await getLTV(makeReq())
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
  })

  it('returns 500 on unexpected DB error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.deal.findMany.mockRejectedValue(new Error('db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await getLTV(makeReq())
    expect(res.status).toBe(500)
    spy.mockRestore()
  })

  it('respects ?limit parameter', async () => {
    const db = require('@/lib/db/prisma')
    // Create 5 contacts each with 1 deal
    const manyDeals = [1, 2, 3, 4, 5].map((i) => ({
      contactId: `con_${i}`,
      value: i * 100_000,
      actualCloseDate: CLOSE_DATE_1,
      contact: { id: `con_${i}`, firstName: `Contact`, lastName: `${i}`, email: `c${i}@example.com` },
    }))
    db.prisma.deal.findMany.mockResolvedValue(manyDeals)

    const res = await getLTV(makeReq('?limit=3'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.contacts).toHaveLength(3)
    expect(body.total_contacts).toBe(5)
    // Should return top-3 by total_value (highest first)
    expect(body.contacts[0].total_value).toBe(500_000)
  })
})
