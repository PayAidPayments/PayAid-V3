import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/v1/revenue/feedback/route'

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
  persistRevenueFeedback: jest.fn(),
}))

describe('POST /api/v1/revenue/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when x-idempotency-key is missing', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/v1/revenue/feedback', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({
        recommendation_id: 'rec_1',
        deal_id: 'd1',
        accepted: true,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 and persists feedback with idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m1-revenue-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    svc.persistRevenueFeedback.mockResolvedValue({
      deduplicated: false,
      audit: { timestamp: new Date('2026-04-07T12:00:00.000Z') },
    })

    const req = new NextRequest('http://localhost/api/v1/revenue/feedback', {
      method: 'POST',
      headers: {
        authorization: 'Bearer t',
        'content-type': 'application/json',
        'x-idempotency-key': 'idem_fb_1',
      },
      body: JSON.stringify({
        recommendation_id: 'rec_x',
        deal_id: 'deal_1',
        accepted: false,
      }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.deduplicated).toBe(false)
    expect(svc.persistRevenueFeedback).toHaveBeenCalledWith(
      'tn_1',
      'usr_1',
      'idem_fb_1',
      expect.objectContaining({ recommendation_id: 'rec_x', deal_id: 'deal_1', accepted: false })
    )
  })
})
