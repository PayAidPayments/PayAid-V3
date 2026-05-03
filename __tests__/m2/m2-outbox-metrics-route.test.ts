import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/outbox/metrics/route'

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

jest.mock('@/lib/outbox/dispatcher', () => ({
  getOutboxOperationalMetrics: jest.fn(),
}))

jest.mock('@/lib/outbox/alerts', () => ({
  evaluateOutboxAlerts: jest.fn(),
}))

jest.mock('@/lib/cache/multi-layer', () => ({
  multiLayerCache: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
  },
}))

describe('GET /api/v1/outbox/metrics (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 with tenantId, metrics, and alerts payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const dispatcher = require('@/lib/outbox/dispatcher')
    const alerts = require('@/lib/outbox/alerts')
    const cache = require('@/lib/cache/multi-layer')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    cache.multiLayerCache.get.mockResolvedValue(null)
    dispatcher.getOutboxOperationalMetrics.mockResolvedValue({
      pending: 2,
      failed: 0,
      recentDispatches: 5,
    })
    alerts.evaluateOutboxAlerts.mockReturnValue([])

    const req = new NextRequest('http://localhost/api/v1/outbox/metrics', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.tenantId).toBe('tn_m2')
    expect(body.metrics.pending).toBe(2)
    expect(Array.isArray(body.alerts)).toBe(true)
    expect(dispatcher.getOutboxOperationalMetrics).toHaveBeenCalledWith('tn_m2')
  })
})
