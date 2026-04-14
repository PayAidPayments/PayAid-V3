import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/v1/workflows/[id]/publish/route'

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
  publishWorkflow: jest.fn(),
  markWorkflowAudit: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/analytics/track', () => ({
  trackEvent: jest.fn(),
}))

describe('POST /api/v1/workflows/[id]/publish (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('publishes workflow and returns status payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    service.publishWorkflow.mockResolvedValue({
      id: 'wf_1',
      name: 'Follow-up Workflow',
      updatedAt: '2026-04-07T12:00:00.000Z',
    })

    const req = new NextRequest('http://localhost/api/v1/workflows/wf_1/publish', {
      method: 'POST',
      headers: { authorization: 'Bearer t' },
    })
    const res = await POST(req, { params: { id: 'wf_1' } })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.workflow_id).toBe('wf_1')
    expect(body.status).toBe('published')
    expect(service.publishWorkflow).toHaveBeenCalledWith('tn_m2', 'wf_1')
  })

  it('returns 404 when workflow does not exist', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    service.publishWorkflow.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/v1/workflows/wf_missing/publish', {
      method: 'POST',
      headers: { authorization: 'Bearer t' },
    })
    const res = await POST(req, { params: { id: 'wf_missing' } })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Workflow not found')
  })

  it('returns 403 when permission is denied', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    perms.assertAnyPermission.mockRejectedValue(new perms.PermissionDeniedError('denied'))

    const req = new NextRequest('http://localhost/api/v1/workflows/wf_1/publish', {
      method: 'POST',
      headers: { authorization: 'Bearer t' },
    })
    const res = await POST(req, { params: { id: 'wf_1' } })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('PERMISSION_DENIED')
  })
})

