import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/apps/dashboard/app/api/calls/route'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    aICall: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('GET /api/calls (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns calls list and pagination', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.aICall.findMany.mockResolvedValue([
      {
        id: 'call_1',
        tenantId: 'tn_m2',
        phoneNumber: '+911234567890',
        status: 'COMPLETED',
        _count: { recordings: 0, transcripts: 1 },
      },
    ])
    db.prisma.aICall.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/calls?page=1&limit=50', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.calls).toHaveLength(1)
    expect(body.calls[0].id).toBe('call_1')
    expect(body.pagination.total).toBe(1)
    expect(body.pagination.page).toBe(1)
  })

  it('returns 401 when unauthenticated', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/calls')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 500 when fetching calls fails unexpectedly', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.aICall.findMany.mockRejectedValue(new Error('calls read failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = new NextRequest('http://localhost/api/calls?page=1&limit=50', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to get calls')
    consoleSpy.mockRestore()
  })
})

describe('POST /api/calls (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates outbound call and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.aICall.create.mockResolvedValue({
      id: 'call_new',
      tenantId: 'tn_m2',
      phoneNumber: '+911234567890',
      direction: 'OUTBOUND',
      status: 'RINGING',
    })

    const req = new NextRequest('http://localhost/api/calls', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+911234567890', direction: 'OUTBOUND' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.id).toBe('call_new')
    expect(body.status).toBe('RINGING')
    expect(db.prisma.aICall.create).toHaveBeenCalled()
  })

  it('returns 400 for validation error', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })

    const req = new NextRequest('http://localhost/api/calls', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 401 when unauthenticated', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/calls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+911234567890' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })
})
