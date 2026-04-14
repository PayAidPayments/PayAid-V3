import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/apps/dashboard/app/api/quotes/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((e: unknown) => e),
}))

jest.mock('@/lib/quotes/quote-generator', () => ({
  QuoteGeneratorService: {
    generateQuoteFromDeal: jest.fn(),
    listQuotes: jest.fn(),
  },
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

describe('POST /api/quotes (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generates quote and returns success payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const quotes = require('@/lib/quotes/quote-generator')
    const m0 = require('@/lib/ai-native/m0-service')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    m0.findIdempotentRequest.mockResolvedValue(null)
    quotes.QuoteGeneratorService.generateQuoteFromDeal.mockResolvedValue({
      id: 'q_1',
      dealId: 'd_1',
      status: 'draft',
    })
    m0.markIdempotentRequest.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost/api/quotes', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json', 'x-idempotency-key': 'idem-1' },
      body: JSON.stringify({
        dealId: 'd_1',
        lineItems: [{ productName: 'Service A', quantity: 1, unitPrice: 1000 }],
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('q_1')
  })

  it('returns 400 for validation error', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })

    const req = new NextRequest('http://localhost/api/quotes', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 500 when quote generation fails unexpectedly', async () => {
    const auth = require('@/lib/middleware/auth')
    const quotes = require('@/lib/quotes/quote-generator')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    quotes.QuoteGeneratorService.generateQuoteFromDeal.mockRejectedValue(new Error('quote service down'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = new NextRequest('http://localhost/api/quotes', {
      method: 'POST',
      headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
      body: JSON.stringify({
        dealId: 'd_1',
        lineItems: [{ productName: 'Service A', quantity: 1, unitPrice: 1000 }],
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('quote service down')
    consoleSpy.mockRestore()
  })
})

describe('GET /api/quotes (M2 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists quotes and returns success payload', async () => {
    const auth = require('@/lib/middleware/auth')
    const quotes = require('@/lib/quotes/quote-generator')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    quotes.QuoteGeneratorService.listQuotes.mockResolvedValue([{ id: 'q_1', status: 'draft' }])

    const req = new NextRequest('http://localhost/api/quotes?status=draft', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('q_1')
  })

  it('returns 500 when list quotes fails unexpectedly', async () => {
    const auth = require('@/lib/middleware/auth')
    const quotes = require('@/lib/quotes/quote-generator')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m2', userId: 'usr_1' })
    quotes.QuoteGeneratorService.listQuotes.mockRejectedValue(new Error('list quotes failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = new NextRequest('http://localhost/api/quotes?status=draft', {
      headers: { authorization: 'Bearer t' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to list quotes')
    consoleSpy.mockRestore()
  })
})

