import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/v1/workflows/route'

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
  listWorkflows: jest.fn(),
  mapWorkflowStatus: jest.fn((isActive: boolean) => (isActive ? 'active' : 'paused')),
}))

describe('GET /api/v1/workflows (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns workflows payload with mapped status', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    service.listWorkflows.mockResolvedValue([
      {
        id: 'wf_1',
        tenantId: 'tn_m2',
        name: 'Follow-up Workflow',
        description: 'Send follow-up',
        isActive: true,
        triggerEvent: 'deal.updated',
        steps: [],
        createdAt: '2026-04-07T00:00:00.000Z',
      },
    ])

    const req = new NextRequest('http://localhost/api/v1/workflows', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.count).toBe(1)
    expect(body.workflows[0].workflow_id).toBe('wf_1')
    expect(body.workflows[0].status).toBe('active')
    expect(service.listWorkflows).toHaveBeenCalledWith('tn_m2')
  })
})

