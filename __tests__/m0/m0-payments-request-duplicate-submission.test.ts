import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createPaymentRequest } from '@/apps/dashboard/app/api/payments/request/route'

jest.mock('@/lib/payments/payaid', () => ({
  getPayAidPayments: jest.fn(),
}))

jest.mock('@/lib/middleware/auth', () => ({
  authenticateRequest: jest.fn(),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

describe('payments request duplicate-submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns deduplicated response for repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const payaid = require('@/lib/payments/payaid')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.authenticateRequest.mockResolvedValue({ userId: 'usr_1', tenantId: 'tn_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_pay_req_1',
      afterSnapshot: { order_id: 'ORD-001' },
    })

    const req = new NextRequest('http://localhost/api/payments/request', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_pay_req_1',
      },
      body: JSON.stringify({
        order_id: 'ORD-001',
        amount: 1000,
        description: 'Test payment',
        name: 'Customer A',
        email: 'a@example.com',
        phone: '9999999999',
        city: 'Mumbai',
        zip_code: '400001',
        return_url: 'https://example.com/success',
      }),
    })

    const res = await createPaymentRequest(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.order_id).toBe('ORD-001')
    expect(payaid.getPayAidPayments).not.toHaveBeenCalled()
  })
})
