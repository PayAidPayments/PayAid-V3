import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/v1/signals/ingest/route'

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
  hasSignalBeenIngested: jest.fn(),
  persistSignalAudit: jest.fn(),
}))

describe('POST /api/v1/signals/ingest (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 validation error when event_id is missing', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/v1/signals/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer t',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: 'tn_m2',
        signal_type: 'status_change',
        entity_type: 'deal',
        entity_id: 'd_1',
        occurred_at: '2026-04-07T00:00:00.000Z',
        source: 'crm',
        payload: { stage: 'proposal' },
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })
})

