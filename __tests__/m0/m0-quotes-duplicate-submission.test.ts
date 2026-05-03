import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createQuote } from '@/apps/dashboard/app/api/quotes/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
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

describe('quotes create duplicate-submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns deduplicated quote when x-idempotency-key is reused', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const quoteGenerator = require('@/lib/quotes/quote-generator')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_quote_1',
      afterSnapshot: { quote_id: 'quote_existing_1' },
    })

    const req = new NextRequest('http://localhost/api/quotes', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_quote_key',
      },
      body: JSON.stringify({
        dealId: 'deal_1',
        lineItems: [
          { productName: 'Implementation', quantity: 1, unitPrice: 10000 },
        ],
      }),
    })

    const res = await createQuote(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.deduplicated).toBe(true)
    expect(body.data.id).toBe('quote_existing_1')
    expect(quoteGenerator.QuoteGeneratorService.generateQuoteFromDeal).not.toHaveBeenCalled()
  })
})
