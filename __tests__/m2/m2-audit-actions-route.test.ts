import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/audit/actions/route'

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

jest.mock('@/lib/ai-native/m0-service', () => ({
  listActionAudit: jest.fn(),
}))

jest.mock('@/lib/privacy/redaction', () => ({
  redactPII: jest.fn((value: unknown) => value),
}))

describe('GET /api/v1/audit/actions (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns mapped actions payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    service.listActionAudit.mockResolvedValue([
      {
        id: 'a1',
        entityType: 'deal',
        entityId: 'd1',
        changedBy: 'usr_1',
        changeSummary: 'stage changed',
        beforeSnapshot: { stage: 'lead' },
        afterSnapshot: { stage: 'proposal' },
        timestamp: '2026-04-07T00:00:00.000Z',
      },
    ])

    const req = new NextRequest('http://localhost/api/v1/audit/actions?limit=10', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.count).toBe(1)
    expect(body.actions[0].entity_type).toBe('deal')
    expect(body.actions[0].summary).toBe('stage changed')
  })
})

