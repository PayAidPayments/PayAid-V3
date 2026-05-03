import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/calls/[id]/route'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    aICall: {
      findFirst: jest.fn(),
    },
  },
}))

describe('GET /api/calls/[id] (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns call detail payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.aICall.findFirst.mockResolvedValue({
      id: 'call_1',
      tenantId: 'tn_m2',
      status: 'COMPLETED',
      recordings: [],
      transcripts: [],
    })

    const req = new NextRequest('http://localhost/api/calls/call_1', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'call_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe('call_1')
    expect(body.status).toBe('COMPLETED')
  })

  it('returns 404 when call is not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.aICall.findFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/calls/call_missing', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'call_missing' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Call not found')
  })

  it('returns 401 when unauthenticated', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/calls/call_1')
    const res = await GET(req, { params: Promise.resolve({ id: 'call_1' }) })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })
})
