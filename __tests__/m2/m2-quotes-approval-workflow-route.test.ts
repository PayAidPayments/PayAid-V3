import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/apps/dashboard/app/api/quotes/[id]/approval-workflow/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    quote: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    quoteApproval: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

describe('POST /api/quotes/[id]/approval-workflow (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates approval workflow and returns approvals', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    const m0 = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    m0.findIdempotentRequest.mockResolvedValue(null)
    db.prisma.quote.findFirst.mockResolvedValue({ id: 'q_1', tenantId: 'tn_m2' })
    db.prisma.quote.update.mockResolvedValue({})
    db.prisma.quoteApproval.create.mockResolvedValue({
      id: 'qa_1',
      quoteId: 'q_1',
      status: 'PENDING',
    })
    m0.markIdempotentRequest.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/quotes/q_1/approval-workflow', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json', 'x-idempotency-key': 'idem-qa-1' },
      body: JSON.stringify({
        workflow: [
          {
            approverId: 'u_1',
            approverName: 'Approver One',
            approverEmail: 'one@example.com',
            order: 1,
          },
        ],
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'q_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.quoteId).toBe('q_1')
    expect(body.data.approvals).toHaveLength(1)
  })

  it('returns 404 when quote does not exist', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.quote.findFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/quotes/q_missing/approval-workflow', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ workflow: [] }),
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'q_missing' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Quote not found')
  })
})
