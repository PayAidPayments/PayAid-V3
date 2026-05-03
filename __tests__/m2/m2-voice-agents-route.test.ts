import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/apps/dashboard/app/api/v1/voice-agents/route'

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    voiceAgent: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    tenantMember: {
      findFirst: jest.fn(),
    },
  },
}))

describe('GET /api/v1/voice-agents (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns agents list and pagination', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.voiceAgent.findMany.mockResolvedValue([
      {
        id: 'va_1',
        tenantId: 'tn_m2',
        name: 'Agent One',
        status: 'active',
        language: 'hi',
        createdAt: new Date('2026-04-08T00:00:00.000Z'),
      },
    ])
    db.prisma.voiceAgent.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/v1/voice-agents?page=1&limit=50', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.agents).toHaveLength(1)
    expect(body.agents[0].id).toBe('va_1')
    expect(body.pagination.total).toBe(1)
    expect(body.pagination.page).toBe(1)
  })
})

describe('POST /api/v1/voice-agents (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates voice agent and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })
    db.prisma.voiceAgent.create.mockResolvedValue({
      id: 'va_new',
      tenantId: 'tn_m2',
      name: 'Outbound Agent',
      status: 'active',
      language: 'hi',
      publicId: 'pub_1',
    })

    const req = new NextRequest('http://localhost/api/v1/voice-agents', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Outbound Agent',
        systemPrompt: 'Assist customer calls',
        language: 'hi',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.agent.id).toBe('va_new')
    expect(body.agent.name).toBe('Outbound Agent')
    expect(body.agent.status).toBe('active')
  })

  it('returns 400 for validation error', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.authenticateRequest.mockResolvedValue({ tenantId: 'tn_m2', sub: 'usr_1' })

    const req = new NextRequest('http://localhost/api/v1/voice-agents', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })
})

