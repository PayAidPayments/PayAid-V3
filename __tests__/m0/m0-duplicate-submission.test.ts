import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createWorkflow } from '@/apps/dashboard/app/api/v1/workflows/route'
import { POST as createSequence } from '@/apps/dashboard/app/api/v1/sequences/route'

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn(),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {},
}))

jest.mock('@/lib/middleware/permissions', () => ({
  assertAnyPermission: jest.fn(),
  PermissionDeniedError: class PermissionDeniedError extends Error {},
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  createWorkflow: jest.fn(),
  createSequence: jest.fn(),
  findIdempotentRequest: jest.fn(),
  listWorkflows: jest.fn(),
  mapWorkflowStatus: jest.fn((isActive: boolean) => (isActive ? 'published' : 'draft')),
  markIdempotentRequest: jest.fn(),
  markWorkflowAudit: jest.fn(),
}))

describe('M0 duplicate submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates workflow create when x-idempotency-key repeats', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    service.findIdempotentRequest.mockResolvedValue({
      id: 'audit_1',
      afterSnapshot: { workflow_id: 'wf_existing' },
    })

    const req = new NextRequest('http://localhost/api/v1/workflows', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_key_1',
      },
      body: JSON.stringify({
        name: 'High intent follow-up',
        trigger: { event_type: 'lead.intent_detected' },
        actions: [{ type: 'task.create', params: { title: 'Call' } }],
      }),
    })

    const res = await createWorkflow(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.workflow_id).toBe('wf_existing')
    expect(body.deduplicated).toBe(true)
    expect(service.createWorkflow).not.toHaveBeenCalled()
  })

  it('deduplicates sequence create when x-idempotency-key repeats', async () => {
    const auth = require('@/lib/middleware/auth')
    const service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    service.findIdempotentRequest.mockResolvedValue({
      id: 'audit_2',
      afterSnapshot: { sequence_id: 'seq_existing' },
    })

    const req = new NextRequest('http://localhost/api/v1/sequences', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_key_2',
      },
      body: JSON.stringify({
        name: 'Prospect sequence',
        steps: [{ step_no: 1, channel: 'email', template_id: 'intro_01' }],
      }),
    })

    const res = await createSequence(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.sequence_id).toBe('seq_existing')
    expect(body.deduplicated).toBe(true)
    expect(service.createSequence).not.toHaveBeenCalled()
  })
})
