import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/v1/sequences/route'

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
  createSequence: jest.fn(),
  findIdempotentRequest: jest.fn().mockResolvedValue(null),
  mapWorkflowStatus: jest.fn((isActive: boolean) => (isActive ? 'active' : 'draft')),
  markIdempotentRequest: jest.fn().mockResolvedValue(undefined),
  markWorkflowAudit: jest.fn().mockResolvedValue(undefined),
}))

describe('POST /api/v1/sequences (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a sequence and returns 201 response shape', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    service.createSequence.mockResolvedValue({
      id: 'seq_1',
      tenantId: 'tn_m2',
      name: 'Nurture Sequence',
      isActive: false,
    })

    const req = new NextRequest('http://localhost/api/v1/sequences', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Nurture Sequence',
        status: 'draft',
        steps: [{ step_no: 1, channel: 'email', template_id: 'tpl_1', delay_minutes: 0 }],
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.sequence_id).toBe('seq_1')
    expect(body.tenant_id).toBe('tn_m2')
    expect(body.status).toBe('draft')
  })
})

