import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { computeWebhookSignature } from '@/lib/ai-native/m1-connector-signature'
import { POST } from '@/apps/dashboard/app/api/v1/conversations/webhook/route'

/**
 * M1 connector webhook reliability — delivery signatures, replay window, deduplication.
 * Tests the POST /api/v1/conversations/webhook route which wraps the ingest endpoint
 * with HMAC-SHA256 signature verification and replay-window protection.
 */

const WEBHOOK_SECRET = 'test-webhook-secret-for-ci'

// Patch env before module load
process.env.PAYAID_WEBHOOK_SECRET = WEBHOOK_SECRET

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
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

const sampleEvent = {
  schema_version: '1.0',
  tenant_id: 'tn_test',
  conversation_id: 'conv_001',
  channel: 'whatsapp',
  direction: 'inbound',
  body: 'Hello, I have a question.',
  occurred_at: new Date().toISOString(),
  metadata: {},
}

function makeWebhookRequest(
  body: unknown,
  opts: {
    signature?: string
    timestamp?: string
    idempotencyKey?: string
    deliveryId?: string
    skipSigHeaders?: boolean
  } = {}
) {
  const rawBody = JSON.stringify(body)
  const ts = opts.timestamp ?? String(Date.now())
  const sig = opts.signature ?? computeWebhookSignature(WEBHOOK_SECRET, ts, rawBody)
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: 'Bearer t',
    ...(!opts.skipSigHeaders && {
      'x-webhook-signature': sig,
      'x-webhook-timestamp': ts,
    }),
    ...(opts.idempotencyKey && { 'x-idempotency-key': opts.idempotencyKey }),
    ...(opts.deliveryId && { 'x-delivery-id': opts.deliveryId }),
  }
  return new NextRequest('http://localhost/api/v1/conversations/webhook', {
    method: 'POST',
    headers,
    body: rawBody,
  })
}

describe('M1 connector webhook reliability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const flags = require('@/lib/feature-flags/tenant-feature')
    const svc = require('@/lib/ai-native/m1-conversation-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_test', userId: 'usr_1' })
    auth.handleLicenseError.mockImplementation(() => null)
    flags.assertTenantFeatureEnabled.mockResolvedValue(undefined)
    svc.hasConversationIngestBeenRecorded.mockResolvedValue(null)
    svc.recordConversationIngest.mockResolvedValue({ timestamp: new Date() })
  })

  it('accepts valid signed webhook within replay window', async () => {
    const res = await POST(makeWebhookRequest(sampleEvent, { idempotencyKey: 'delivery_001' }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.accepted).toBe(true)
    expect(body.deduplicated).toBe(false)
    expect(body.idempotency_key).toBe('delivery_001')
    expect(body.schema_version).toBe('1.0')
  })

  it('rejects invalid signature', async () => {
    const res = await POST(
      makeWebhookRequest(sampleEvent, {
        signature: 'aabbcc00deadbeef',
        idempotencyKey: 'delivery_002',
      })
    )
    const body = await res.json()

    expect([401, 403]).toContain(res.status)
    expect(body.code).toBe('SIGNATURE_INVALID')
  })

  it('rejects stale timestamp outside replay window', async () => {
    const staleTs = String(Date.now() - 10 * 60 * 1000) // 10 min ago
    const rawBody = JSON.stringify(sampleEvent)
    const staleSig = computeWebhookSignature(WEBHOOK_SECRET, staleTs, rawBody)

    const res = await POST(
      makeWebhookRequest(sampleEvent, {
        signature: staleSig,
        timestamp: staleTs,
        idempotencyKey: 'delivery_003',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.code).toBe('SIGNATURE_INVALID')
  })

  it('rejects when signature headers are missing', async () => {
    const res = await POST(makeWebhookRequest(sampleEvent, { skipSigHeaders: true, idempotencyKey: 'delivery_004' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.code).toBe('MISSING_SIGNATURE')
  })

  it('deduplicates repeated provider deliveries (same idempotency key)', async () => {
    const svc = require('@/lib/ai-native/m1-conversation-service')
    const firstIngested = new Date()
    svc.hasConversationIngestBeenRecorded.mockResolvedValue({ timestamp: firstIngested })

    const res = await POST(makeWebhookRequest(sampleEvent, { idempotencyKey: 'delivery_005' }))
    const body = await res.json()

    // Must deduplicate and NOT call recordConversationIngest again
    expect(res.status).toBe(200)
    expect(body.accepted).toBe(true)
    expect(body.deduplicated).toBe(true)
    expect(body.idempotency_key).toBe('delivery_005')
    expect(svc.recordConversationIngest).not.toHaveBeenCalled()
  })

  it('accepts delivery using x-delivery-id header for idempotency', async () => {
    const res = await POST(makeWebhookRequest(sampleEvent, { deliveryId: 'provider_abc123' }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.idempotency_key).toBe('provider_abc123')
  })

  it('returns 400 when both idempotency-key and delivery-id are absent', async () => {
    const res = await POST(makeWebhookRequest(sampleEvent))
    expect(res.status).toBe(400)
  })

  it('returns 400 for Zod validation error on malformed event body', async () => {
    // Missing required fields: conversation_id, body, occurred_at
    const malformed = { tenant_id: 'tn_test', channel: 'unknown_xyz' }
    const res = await POST(makeWebhookRequest(malformed, { idempotencyKey: 'delivery_bad' }))
    expect(res.status).toBe(400)
  })
})
