/**
 * M2 smoke — /api/v1/calls (GET list), /api/v1/calls/start, /api/v1/calls/log,
 *             /api/v1/calls/[id]/end, /api/v1/calls/[id]/transcript
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as listCalls } from '@/apps/dashboard/app/api/v1/calls/route'
import { POST as startCall } from '@/apps/dashboard/app/api/v1/calls/start/route'
import { POST as logCall } from '@/apps/dashboard/app/api/v1/calls/log/route'
import { POST as endCall } from '@/apps/dashboard/app/api/v1/calls/[id]/end/route'
import { GET as getTranscript, POST as postTranscript } from '@/apps/dashboard/app/api/v1/calls/[id]/transcript/route'

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

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    aICall: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    callTranscript: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}))

function makeReq(url: string, method = 'POST', body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

const sampleCall = {
  id: 'call_1',
  phoneNumber: '+91 98765 43210',
  direction: 'OUTBOUND',
  status: 'RINGING',
  duration: null,
  contactId: 'ct_1',
  dealId: 'd_1',
  startedAt: new Date('2026-04-08T10:00:00Z'),
  endedAt: null,
  handledByAI: true,
}

// ─── GET /api/v1/calls (list) ────────────────────────────────────────────

describe('GET /api/v1/calls (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 with paginated calls list', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    db.prisma.aICall.findMany.mockResolvedValue([sampleCall])
    db.prisma.aICall.count.mockResolvedValue(1)

    const res = await listCalls(
      new NextRequest('http://localhost/api/v1/calls', {
        headers: { authorization: 'Bearer t' },
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.calls).toHaveLength(1)
    expect(body.calls[0].id).toBe('call_1')
    expect(body.calls[0].phone_number).toBe('+91 98765 43210')
    expect(body.calls[0].direction).toBe('outbound')
    expect(body.calls[0].status).toBe('ringing')
    expect(body.pagination.total).toBe(1)
  })

  it('returns empty list with pagination meta', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    db.prisma.aICall.findMany.mockResolvedValue([])
    db.prisma.aICall.count.mockResolvedValue(0)

    const res = await listCalls(
      new NextRequest('http://localhost/api/v1/calls?status=completed', {
        headers: { authorization: 'Bearer t' },
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.calls).toHaveLength(0)
    expect(body.pagination.total).toBe(0)
  })

  it('returns 500 on DB error', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    db.prisma.aICall.findMany.mockRejectedValue(new Error('db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await listCalls(
      new NextRequest('http://localhost/api/v1/calls', {
        headers: { authorization: 'Bearer t' },
      })
    )
    expect(res.status).toBe(500)
    spy.mockRestore()
  })

  it('returns 403 when module access is denied by license handler', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await listCalls(
      new NextRequest('http://localhost/api/v1/calls', {
        headers: { authorization: 'Bearer t' },
      })
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── POST /api/v1/calls/start ─────────────────────────────────────────────

describe('POST /api/v1/calls/start (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a call and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.aICall.create.mockResolvedValue(sampleCall)

    const res = await startCall(
      makeReq('/api/v1/calls/start', 'POST', {
        phone_number: '+91 98765 43210',
        direction: 'OUTBOUND',
        contact_id: 'ct_1',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.call.id).toBe('call_1')
    expect(body.call.status).toBe('ringing')
    expect(body.call.contact_id).toBe('ct_1')
  })

  it('returns 400 for missing phone_number', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const res = await startCall(makeReq('/api/v1/calls/start', 'POST', {}))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 500 on unexpected failure', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.aICall.create.mockRejectedValue(new Error('db fail'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await startCall(
      makeReq('/api/v1/calls/start', 'POST', { phone_number: '+91 98765 43210' })
    )
    expect(res.status).toBe(500)
    spy.mockRestore()
  })

  it('returns 403 when module access is denied by license handler (POST start)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await startCall(
      makeReq('/api/v1/calls/start', 'POST', { phone_number: '+91 98765 43210' })
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── POST /api/v1/calls/log ───────────────────────────────────────────────

describe('POST /api/v1/calls/log (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('logs a call with CRM linkage and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.aICall.create.mockResolvedValue({
      ...sampleCall,
      status: 'COMPLETED',
      duration: 180,
      endedAt: new Date(),
    })

    const res = await logCall(
      makeReq('/api/v1/calls/log', 'POST', {
        phone_number: '+91 98765 43210',
        direction: 'INBOUND',
        status: 'COMPLETED',
        duration_seconds: 180,
        deal_id: 'd_1',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.call.deal_id).toBe('d_1')
    expect(body.call.duration_seconds).toBe(180)
  })

  it('returns 400 for missing required fields', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const res = await logCall(makeReq('/api/v1/calls/log', 'POST', {}))
    expect(res.status).toBe(400)
  })

  it('returns 403 when module access is denied by license handler (POST log)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await logCall(
      makeReq('/api/v1/calls/log', 'POST', {
        phone_number: '+91 98765 43210',
        direction: 'INBOUND',
        status: 'COMPLETED',
      })
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── POST /api/v1/calls/[id]/end ─────────────────────────────────────────

describe('POST /api/v1/calls/[id]/end (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('ends an active call and returns 200', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.aICall.findFirst.mockResolvedValue({ ...sampleCall, status: 'IN_PROGRESS' })
    db.prisma.aICall.update.mockResolvedValue({
      ...sampleCall,
      status: 'COMPLETED',
      duration: 240,
      endedAt: new Date(),
      aiIntent: 'interested',
    })

    const res = await endCall(
      makeReq('/api/v1/calls/call_1/end', 'POST', {
        status: 'COMPLETED',
        duration_seconds: 240,
        disposition: 'interested',
      }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.call.status).toBe('completed')
    expect(body.call.disposition).toBe('interested')
  })

  it('returns 404 when call not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(null)

    const res = await endCall(
      makeReq('/api/v1/calls/no_such/end', 'POST', { status: 'COMPLETED' }),
      { params: Promise.resolve({ id: 'no_such' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns 422 when call is already ended', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.aICall.findFirst.mockResolvedValue({ ...sampleCall, status: 'COMPLETED' })

    const res = await endCall(
      makeReq('/api/v1/calls/call_1/end', 'POST', { status: 'COMPLETED' }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('INVALID_STATE_TRANSITION')
  })

  it('returns 403 when module access is denied by license handler (POST end)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await endCall(
      makeReq('/api/v1/calls/call_1/end', 'POST', { status: 'COMPLETED' }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── GET + POST /api/v1/calls/[id]/transcript ────────────────────────────

describe('GET /api/v1/calls/[id]/transcript (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns transcript payload when transcript exists', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.callTranscript.findFirst.mockResolvedValue({
      id: 'tr_1',
      callId: 'call_1',
      transcript: 'agent: Hello\ncustomer: Hi',
      segments: [],
      language: 'en',
      sentiment: 'neutral',
      sentimentScore: null,
      keyPoints: null,
      actionItems: null,
      createdAt: new Date('2026-04-08T10:05:00Z'),
    })

    const res = await getTranscript(
      new NextRequest('http://localhost/api/v1/calls/call_1/transcript', {
        headers: { authorization: 'Bearer t' },
      }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.transcript.call_id).toBe('call_1')
  })

  it('returns 404 when transcript not found (GET)', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.callTranscript.findFirst.mockResolvedValue(null)

    const res = await getTranscript(
      new NextRequest('http://localhost/api/v1/calls/no_such/transcript', {
        headers: { authorization: 'Bearer t' },
      }),
      { params: Promise.resolve({ id: 'no_such' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns 403 when module access is denied by license handler (GET transcript)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await getTranscript(
      new NextRequest('http://localhost/api/v1/calls/call_1/transcript', {
        headers: { authorization: 'Bearer t' },
      }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

describe('POST /api/v1/calls/[id]/transcript (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a transcript and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(sampleCall)
    db.prisma.callTranscript.findFirst.mockResolvedValue(null)
    db.prisma.callTranscript.create.mockResolvedValue({
      id: 'tr_1',
      callId: 'call_1',
      language: 'en',
      sentiment: 'positive',
      createdAt: new Date(),
    })

    const res = await postTranscript(
      makeReq('/api/v1/calls/call_1/transcript', 'POST', {
        transcript: 'agent: Hello\ncustomer: Hi',
        segments: [
          { speaker: 'agent', text: 'Hello', start_ms: 0, end_ms: 800, confidence: 0.95 },
          { speaker: 'customer', text: 'Hi', start_ms: 900, end_ms: 1300, confidence: 0.95 },
        ],
        sentiment: 'positive',
      }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.transcript.segment_count).toBe(2)
    expect(body.transcript.sentiment).toBe('positive')
  })

  it('returns 200 and was_updated when transcript exists', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(sampleCall)
    db.prisma.callTranscript.findFirst.mockResolvedValue({ id: 'tr_existing' })
    db.prisma.callTranscript.update.mockResolvedValue({
      id: 'tr_existing',
      callId: 'call_1',
      language: 'en',
      sentiment: 'neutral',
      createdAt: new Date(),
    })

    const res = await postTranscript(
      makeReq('/api/v1/calls/call_1/transcript', 'POST', {
        transcript: 'updated transcript',
        segments: [{ speaker: 'customer', text: 'redacted', start_ms: 0, end_ms: 700, confidence: 0.9 }],
      }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.was_updated).toBe(true)
  })

  it('returns 404 when call not found (POST)', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(null)

    const res = await postTranscript(
      makeReq('/api/v1/calls/no_such/transcript', 'POST', {
        transcript: 'agent: hi',
      }),
      { params: Promise.resolve({ id: 'no_such' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(sampleCall)

    const res = await postTranscript(
      makeReq('/api/v1/calls/call_1/transcript', 'POST', { transcript: '' }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    expect(res.status).toBe(400)
  })

  it('returns 403 when module access is denied by license handler (POST transcript)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await postTranscript(
      makeReq('/api/v1/calls/call_1/transcript', 'POST', { transcript: 'hello' }),
      { params: Promise.resolve({ id: 'call_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── Feature flag gate (m2_voice) ────────────────────────────────────────

describe('M2 feature flag gate — m2_voice', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 FEATURE_DISABLED when m2_voice is disabled on calls/start', async () => {
    const auth = require('@/lib/middleware/auth')
    const ff = require('@/lib/feature-flags/tenant-feature')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
      new ff.TenantFeatureDisabledError('m2_voice')
    )
    const res = await startCall(makeReq('/api/v1/calls/start', 'POST', { phone_number: '+91 98765 43210' }))
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
  })
})
