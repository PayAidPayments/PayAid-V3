import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/apps/dashboard/app/api/calls/faqs/route'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    callFAQ: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('GET /api/calls/faqs (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns FAQ list payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.callFAQ.findMany.mockResolvedValue([{ id: 'faq_1', question: 'Q?', answer: 'A' }])

    const req = new NextRequest('http://localhost/api/calls/faqs?isActive=true', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.faqs)).toBe(true)
    expect(body.faqs[0].id).toBe('faq_1')
  })

  it('returns 401 when unauthenticated', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/calls/faqs')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 500 when create fails unexpectedly', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.callFAQ.create.mockRejectedValue(new Error('db write failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = new NextRequest('http://localhost/api/calls/faqs', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'What is PayAid?', answer: 'Payment platform' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to create FAQ')
    consoleSpy.mockRestore()
  })
})

describe('POST /api/calls/faqs (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates FAQ and returns 201 payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.callFAQ.create.mockResolvedValue({
      id: 'faq_new',
      question: 'What is PayAid?',
      answer: 'Payment platform',
    })

    const req = new NextRequest('http://localhost/api/calls/faqs', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'What is PayAid?', answer: 'Payment platform' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.id).toBe('faq_new')
    expect(body.question).toBe('What is PayAid?')
  })

  it('returns 400 for validation error', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })

    const req = new NextRequest('http://localhost/api/calls/faqs', {
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

    const req = new NextRequest('http://localhost/api/calls/faqs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'Q?', answer: 'A' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })
})
