import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/v1/admin/tenants/[id]/feature-flags/simulate/route'

jest.mock('@/lib/middleware/requireSuperAdmin', () => ({
  requireSuperAdmin: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
    },
    featureToggle: {
      findMany: jest.fn(),
    },
  },
}))

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/v1/admin/tenants/tn_1/feature-flags/simulate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/admin/tenants/[id]/feature-flags/simulate (M3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns simulation impacts for valid flag changes', async () => {
    const auth = require('@/lib/middleware/requireSuperAdmin')
    const db = require('@/lib/db/prisma')
    auth.requireSuperAdmin.mockResolvedValue({ sub: 'sa_1' })
    db.prisma.tenant.findUnique.mockResolvedValue({
      id: 'tn_1',
      name: 'Demo Tenant',
      _count: { users: 5, deals: 12, contacts: 30 },
    })
    db.prisma.featureToggle.findMany.mockResolvedValue([
      { featureName: 'm2_cpq', isEnabled: true },
      { featureName: 'm2_voice', isEnabled: true },
    ])

    const res = await POST(makeReq({ flags: { m2_cpq: false } }), {
      params: { id: 'tn_1' },
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.summary.total_changes).toBe(1)
    expect(Array.isArray(body.impacts)).toBe(true)
    expect(body.impacts.length).toBeGreaterThan(0)
  })

  it('returns 400 on unknown flag name', async () => {
    const auth = require('@/lib/middleware/requireSuperAdmin')
    auth.requireSuperAdmin.mockResolvedValue({ sub: 'sa_1' })

    const res = await POST(makeReq({ flags: { unknown_flag: true } }), {
      params: { id: 'tn_1' },
    })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 404 when tenant is missing', async () => {
    const auth = require('@/lib/middleware/requireSuperAdmin')
    const db = require('@/lib/db/prisma')
    auth.requireSuperAdmin.mockResolvedValue({ sub: 'sa_1' })
    db.prisma.tenant.findUnique.mockResolvedValue(null)

    const res = await POST(makeReq({ flags: { m2_cpq: false } }), {
      params: { id: 'tn_missing' },
    })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Tenant not found')
  })
})

