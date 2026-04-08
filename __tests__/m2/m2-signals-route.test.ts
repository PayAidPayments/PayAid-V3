import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/signals/route'

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

jest.mock('@/lib/ai-native/m0-service', () => ({
  listSignals: jest.fn(),
}))

describe('GET /api/v1/signals (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns filtered signal list payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    service.listSignals.mockResolvedValue([
      {
        id: 'sig_1',
        tenantId: 'tn_m2',
        entityType: 'deal',
        status: 'new',
        intentScore: 0.92,
      },
    ])

    const req = new NextRequest(
      'http://localhost/api/v1/signals?entityType=deal&status=new&intentMin=0.5&limit=20',
      { headers: { authorization: 'Bearer t' } }
    )
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.count).toBe(1)
    expect(body.signals[0].id).toBe('sig_1')
    expect(service.listSignals).toHaveBeenCalledWith({
      tenantId: 'tn_m2',
      entityType: 'deal',
      status: 'new',
      intentMin: 0.5,
      limit: 20,
    })
  })
})

