import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/apps/dashboard/app/api/crm/cpq/quotes/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    quote: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    deal: {
      findFirst: jest.fn(),
    },
  },
}))

describe('GET /api/crm/cpq/quotes (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns CRM CPQ quotes payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.quote.findMany.mockResolvedValue([{ id: 'q_1', status: 'draft' }])

    const req = new NextRequest('http://localhost/api/crm/cpq/quotes?status=draft', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.quotes)).toBe(true)
    expect(body.quotes[0].id).toBe('q_1')
  })
})

describe('POST /api/crm/cpq/quotes (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates CRM CPQ quote and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    db.prisma.deal.findFirst.mockResolvedValue({ id: 'd_1', tenantId: 'tn_m2', contactId: 'c_1' })
    db.prisma.quote.findUnique.mockResolvedValue(null)
    db.prisma.quote.create.mockResolvedValue({ id: 'q_new', status: 'draft' })

    const req = new NextRequest('http://localhost/api/crm/cpq/quotes', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({
        dealId: 'd_1',
        lineItems: [{ productName: 'Service A', quantity: 1, unitPrice: 1000 }],
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.quote.id).toBe('q_new')
  })

  it('returns 400 when dealId is missing', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/crm/cpq/quotes', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({ lineItems: [] }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('dealId is required')
  })
})
