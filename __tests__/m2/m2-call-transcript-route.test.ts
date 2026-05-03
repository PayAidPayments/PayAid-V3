import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/apps/dashboard/app/api/v1/calls/[id]/transcript/route'

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
    aICall: { findFirst: jest.fn() },
    callTranscript: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}))

const sampleCall = { id: 'call_1', tenantId: 'tn_m2', status: 'completed', phoneNumber: '+919999999999' }

const sampleTranscript = {
  id: 'tr_1',
  callId: 'call_1',
  language: 'en',
  sentiment: 'positive',
  createdAt: new Date('2026-04-08T10:05:00.000Z'),
  transcript: 'Hello! How can I help you?',
  segments: null,
  sentimentScore: null,
  keyPoints: null,
  actionItems: null,
}

function makeReq(method: 'POST' | 'GET', callId: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/v1/calls/${callId}/transcript`, {
    method,
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

const validTranscriptBody = {
  transcript: 'Hello! How can I help you? Great, let me check that for you.',
  language: 'en',
  sentiment: 'positive',
  sentiment_score: 0.85,
  segments: [
    { speaker: 'agent', text: 'Hello! How can I help you?', start_ms: 0, end_ms: 2000, confidence: 0.97 },
    { speaker: 'customer', text: 'I wanted to ask about my invoice.', start_ms: 2200, end_ms: 4800, confidence: 0.92 },
  ],
  key_points: ['Customer asked about invoice', 'Resolved during call'],
  action_items: ['Send invoice copy'],
}

describe('POST /api/v1/calls/[id]/transcript (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Re-apply defaults cleared by clearAllMocks
    const auth = require('@/lib/middleware/auth')
    const flags = require('@/lib/feature-flags/tenant-feature')
    auth.handleLicenseError.mockImplementation(() => null)
    flags.assertTenantFeatureEnabled.mockResolvedValue(undefined)
  })

  it('creates transcript and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(sampleCall)
    db.prisma.callTranscript.findFirst.mockResolvedValue(null)
    db.prisma.callTranscript.create.mockResolvedValue(sampleTranscript)

    const res = await POST(makeReq('POST', 'call_1', validTranscriptBody), {
      params: Promise.resolve({ id: 'call_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.transcript.id).toBe('tr_1')
    expect(body.transcript.call_id).toBe('call_1')
    expect(body.transcript.segment_count).toBe(2)
    expect(body.was_updated).toBe(false)
    expect(body.schema_version).toBe('1.0')
  })

  it('updates existing transcript and returns 200', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(sampleCall)
    db.prisma.callTranscript.findFirst.mockResolvedValue({ id: 'tr_existing' })
    db.prisma.callTranscript.update.mockResolvedValue({ ...sampleTranscript, id: 'tr_existing' })

    const res = await POST(makeReq('POST', 'call_1', validTranscriptBody), {
      params: Promise.resolve({ id: 'call_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.was_updated).toBe(true)
    expect(db.prisma.callTranscript.update).toHaveBeenCalled()
    expect(db.prisma.callTranscript.create).not.toHaveBeenCalled()
  })

  it('returns 404 when call not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(null)

    const res = await POST(makeReq('POST', 'call_999', validTranscriptBody), {
      params: Promise.resolve({ id: 'call_999' }),
    })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Call not found')
  })

  it('returns 400 for missing transcript text', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(sampleCall)

    const res = await POST(makeReq('POST', 'call_1', { language: 'en' }), {
      params: Promise.resolve({ id: 'call_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 400 for confidence out of range', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(sampleCall)

    const badBody = {
      ...validTranscriptBody,
      segments: [{ speaker: 'agent', text: 'Hi', start_ms: 0, end_ms: 500, confidence: 2.5 }],
    }
    const res = await POST(makeReq('POST', 'call_1', badBody), {
      params: Promise.resolve({ id: 'call_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 500 on unexpected db error', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.aICall.findFirst.mockRejectedValue(new Error('db error'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeReq('POST', 'call_1', validTranscriptBody), {
      params: Promise.resolve({ id: 'call_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(500)
    spy.mockRestore()
  })
})

describe('GET /api/v1/calls/[id]/transcript (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const flags = require('@/lib/feature-flags/tenant-feature')
    auth.handleLicenseError.mockImplementation(() => null)
    flags.assertTenantFeatureEnabled.mockResolvedValue(undefined)
  })

  it('returns transcript for a call', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.callTranscript.findFirst.mockResolvedValue(sampleTranscript)

    const res = await GET(makeReq('GET', 'call_1'), {
      params: Promise.resolve({ id: 'call_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.transcript.id).toBe('tr_1')
    expect(body.transcript.schema_version).toBe('1.0')
  })

  it('returns 404 when no transcript exists', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.callTranscript.findFirst.mockResolvedValue(null)

    const res = await GET(makeReq('GET', 'call_1'), {
      params: Promise.resolve({ id: 'call_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Transcript not found for this call')
  })
})
