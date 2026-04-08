import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createRefund } from '@/apps/dashboard/app/api/payments/refund/route'

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

describe('payments refund duplicate-submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns deduplicated response for repeated refund request key', async () => {
    const auth = require('@/lib/middleware/auth')
    const payaid = require('@/lib/payments/payaid')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.authenticateRequest.mockResolvedValue({ userId: 'usr_1', tenantId: 'tn_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_ref_1',
      afterSnapshot: { transaction_id: 'txn_123' },
    })

    const req = new NextRequest('http://localhost/api/payments/refund', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_refund_1',
      },
      body: JSON.stringify({
        transaction_id: 'txn_123',
        amount: 500,
        description: 'Customer cancellation',
      }),
    })

    const res = await createRefund(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.data.transaction_id).toBe('txn_123')
    expect(payaid.getPayAidPayments).not.toHaveBeenCalled()
  })
})
