import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/revenue/won-timeseries/route'

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

jest.mock('@/lib/ai-native/m1-revenue-service', () => ({
  getRevenueWonTimeseries: jest.fn(),
}))

describe('GET /api/v1/revenue/won-timeseries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns timeseries JSON (months default 6)', async () => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m1-revenue-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    svc.getRevenueWonTimeseries.mockResolvedValue({
      schema_version: '1.0',
      tenant_id: 'tn_1',
      as_of: new Date('2026-04-07T12:00:00.000Z').toISOString(),
      months: 6,
      points: [],
    })

    const req = new NextRequest('http://localhost/api/v1/revenue/won-timeseries', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.tenant_id).toBe('tn_1')
    expect(body.months).toBe(6)
  })
})

