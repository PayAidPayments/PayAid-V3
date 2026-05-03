import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/v1/conversations/ingest/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/middleware/license', () => ({
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

jest.mock('@/lib/ai-native/m1-conversation-service', () => ({
  hasConversationIngestBeenRecorded: jest.fn(),
  recordConversationIngest: jest.fn(),
}))

const basePayload = {
  tenant_id: 'tn_1',
  conversation_id: 'conv_thread_1',
  channel: 'email' as const,
  direction: 'inbound' as const,
  body: 'Need a quote',
  occurred_at: '2026-04-07T12:00:00.000Z',
}

const CHANNELS = ['email', 'whatsapp', 'sms', 'web', 'phone', 'in_app'] as const

describe('POST /api/v1/conversations/ingest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when x-idempotency-key is missing', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/v1/conversations/ingest', {
      method: 'POST',
      headers: { authorization: 'Bearer t' },
      body: JSON.stringify(basePayload),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 403 when tenant_id does not match auth tenant', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/v1/conversations/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer t',
        'x-idempotency-key': 'idem_1',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...basePayload, tenant_id: 'other_tenant' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns deduplicated response when ingest already recorded', async () => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m1-conversation-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    svc.hasConversationIngestBeenRecorded.mockResolvedValue({
      id: 'a1',
      timestamp: new Date('2026-04-07T12:00:00.000Z'),
    })

    const req = new NextRequest('http://localhost/api/v1/conversations/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer t',
        'x-idempotency-key': 'idem_dup',
        'content-type': 'application/json',
      },
      body: JSON.stringify(basePayload),
    })

    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(svc.recordConversationIngest).not.toHaveBeenCalled()
  })

  it('creates audit row on first ingest', async () => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m1-conversation-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    svc.hasConversationIngestBeenRecorded.mockResolvedValue(null)
    svc.recordConversationIngest.mockResolvedValue({
      id: 'new_audit',
      timestamp: new Date('2026-04-07T12:01:00.000Z'),
    })

    const req = new NextRequest('http://localhost/api/v1/conversations/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer t',
        'x-idempotency-key': 'idem_new',
        'content-type': 'application/json',
      },
      body: JSON.stringify(basePayload),
    })

    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.accepted).toBe(true)
    expect(body.deduplicated).toBe(false)
    expect(svc.recordConversationIngest).toHaveBeenCalled()
  })

  it.each(CHANNELS)('accepts channel ingest route for %s', async (channel) => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m1-conversation-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    svc.hasConversationIngestBeenRecorded.mockResolvedValue(null)
    svc.recordConversationIngest.mockResolvedValue({
      id: `audit_${channel}`,
      timestamp: new Date('2026-04-07T12:02:00.000Z'),
    })

    const req = new NextRequest('http://localhost/api/v1/conversations/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer t',
        'x-idempotency-key': `idem_${channel}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...basePayload, channel }),
    })

    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.accepted).toBe(true)
    expect(svc.recordConversationIngest).toHaveBeenCalled()
  })

  it.each(CHANNELS)('deduplicates connector retry for %s when idempotency key repeats', async (channel) => {
    const auth = require('@/lib/middleware/auth')
    const svc = require('@/lib/ai-native/m1-conversation-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    svc.hasConversationIngestBeenRecorded
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: `audit_${channel}`,
        timestamp: new Date('2026-04-07T12:03:00.000Z'),
      })
    svc.recordConversationIngest.mockResolvedValue({
      id: `audit_${channel}`,
      timestamp: new Date('2026-04-07T12:03:00.000Z'),
    })

    const headers = {
      authorization: 'Bearer t',
      'x-idempotency-key': `idem_retry_${channel}`,
      'content-type': 'application/json',
    }
    const payload = JSON.stringify({ ...basePayload, channel })

    const first = await POST(
      new NextRequest('http://localhost/api/v1/conversations/ingest', {
        method: 'POST',
        headers,
        body: payload,
      })
    )
    const firstBody = await first.json()
    expect(first.status).toBe(201)
    expect(firstBody.deduplicated).toBe(false)

    const second = await POST(
      new NextRequest('http://localhost/api/v1/conversations/ingest', {
        method: 'POST',
        headers,
        body: payload,
      })
    )
    const secondBody = await second.json()
    expect(second.status).toBe(200)
    expect(secondBody.deduplicated).toBe(true)
    expect(svc.recordConversationIngest).toHaveBeenCalledTimes(1)
  })
})
