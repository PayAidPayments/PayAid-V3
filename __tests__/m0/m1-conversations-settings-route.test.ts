import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, PUT } from '@/apps/dashboard/app/api/v1/conversations/settings/route'

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

jest.mock('@/lib/ai-native/m1-conversation-service', () => ({
  getTenantUniboxSlaSettings: jest.fn(),
  updateTenantUniboxSlaSettings: jest.fn(),
}))

describe('GET/PUT /api/v1/conversations/settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET returns tenant settings', async () => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m1-conversation-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    svc.getTenantUniboxSlaSettings.mockResolvedValue({ first_response_sla_minutes: 45, enforce: true })

    const req = new NextRequest('http://localhost/api/v1/conversations/settings', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.settings.first_response_sla_minutes).toBe(45)
  })

  it('PUT validates payload and updates settings', async () => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m1-conversation-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    svc.updateTenantUniboxSlaSettings.mockResolvedValue({ first_response_sla_minutes: 60, enforce: false })

    const req = new NextRequest('http://localhost/api/v1/conversations/settings', {
      method: 'PUT',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ first_response_sla_minutes: 60, enforce: false }),
    })
    const res = await PUT(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.settings.enforce).toBe(false)
    expect(svc.updateTenantUniboxSlaSettings).toHaveBeenCalledWith('tn_1', {
      first_response_sla_minutes: 60,
      enforce: false,
    })
  })
})

