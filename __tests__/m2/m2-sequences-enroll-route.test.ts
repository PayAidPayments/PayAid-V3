import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/v1/sequences/[id]/enroll/route'

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
  enrollSequence: jest.fn(),
  markWorkflowAudit: jest.fn().mockResolvedValue(undefined),
}))

describe('POST /api/v1/sequences/[id]/enroll (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('enrolls sequence and returns 201 payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    service.enrollSequence.mockResolvedValue({
      id: 'enr_1',
      status: 'queued',
      startedAt: '2026-04-07T12:10:00.000Z',
    })

    const req = new NextRequest('http://localhost/api/v1/sequences/seq_1/enroll', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ contact_ids: ['c_1'] }),
    })
    const res = await POST(req, { params: { id: 'seq_1' } })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.enrollment_id).toBe('enr_1')
    expect(body.sequence_id).toBe('seq_1')
    expect(body.status).toBe('queued')
    expect(service.enrollSequence).toHaveBeenCalledWith('tn_m2', 'seq_1', { contact_ids: ['c_1'] })
  })

  it('returns 404 when sequence does not exist', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    service.enrollSequence.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/v1/sequences/seq_missing/enroll', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ contact_ids: ['c_1'] }),
    })
    const res = await POST(req, { params: { id: 'seq_missing' } })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Sequence not found')
  })

  it('returns 403 when permission is denied', async () => {
    const auth = require('@/lib/middleware/auth')
    const perms = require('@/lib/middleware/permissions')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    perms.assertAnyPermission.mockRejectedValue(new perms.PermissionDeniedError('denied'))

    const req = new NextRequest('http://localhost/api/v1/sequences/seq_1/enroll', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ contact_ids: ['c_1'] }),
    })
    const res = await POST(req, { params: { id: 'seq_1' } })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('PERMISSION_DENIED')
  })
})

