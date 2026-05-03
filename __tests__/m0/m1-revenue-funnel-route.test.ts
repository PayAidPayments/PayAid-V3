import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/revenue/funnel/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(public featureName: string) {
      super(`Feature "${featureName}" is disabled`)
      this.name = 'TenantFeatureDisabledError'
    }
  },
}))

jest.mock('@/lib/middleware/permissions', () => ({
  assertAnyPermission: jest.fn().mockResolvedValue(undefined),
  PermissionDeniedError: class PermissionDeniedError extends Error {},
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    deal: {
      findMany: jest.fn(),
    },
  },
}))

describe('GET /api/v1/revenue/funnel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns funnel JSON from open + won deals', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.deal.findMany
      .mockResolvedValueOnce([
        { stage: 'lead', value: 1000 },
        { stage: 'proposal', value: 2000 },
      ])
      .mockResolvedValueOnce([{ value: 500 }])
      .mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost/api/v1/revenue/funnel', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.tenant_id).toBe('tn_1')
    expect(body.open_deal_count).toBe(2)
    expect(body.open_pipeline_value_inr).toBe(3000)
    expect(body.closed_won_count_30d).toBe(1)
    expect(body.closed_won_count_prev_30d).toBe(0)
    expect(body.stages.length).toBeGreaterThanOrEqual(1)
  })
})
