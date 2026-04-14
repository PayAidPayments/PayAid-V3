import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/apps/dashboard/app/api/crm/cpq/quotes/[id]/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    quote: {
      findFirst: jest.fn(),
    },
  },
}))

describe('GET /api/crm/cpq/quotes/[id] (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns quote detail payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.quote.findFirst.mockResolvedValue({
      id: 'q_1',
      tenantId: 'tn_m2',
      status: 'draft',
      lineItems: [],
    })

    const req = new NextRequest('http://localhost/api/crm/cpq/quotes/q_1', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'q_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.quote.id).toBe('q_1')
  })

  it('returns 404 when quote is not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.quote.findFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/crm/cpq/quotes/q_missing', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req, { params: Promise.resolve({ id: 'q_missing' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Quote not found')
  })
})
