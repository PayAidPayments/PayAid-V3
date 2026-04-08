import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as sendWithPayment } from '@/apps/dashboard/app/api/invoices/[id]/send-with-payment/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    invoice: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/payments/payaid', () => ({
  createPayAidPayments: jest.fn(),
}))

jest.mock('@/lib/payments/get-tenant-payment-config', () => ({
  getTenantPayAidConfig: jest.fn(),
}))

jest.mock('@/lib/queue/bull', () => ({
  mediumPriorityQueue: { add: jest.fn() },
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

describe('invoice send-with-payment duplicate-submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns deduplicated success for repeated key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_send_pay_1',
      afterSnapshot: { invoice_id: 'inv_existing_1' },
    })

    const req = new NextRequest('http://localhost/api/invoices/inv_1/send-with-payment', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_inv_send_pay_1',
      },
      body: JSON.stringify({ email: 'a@acme.com' }),
    })

    const res = await sendWithPayment(req, { params: Promise.resolve({ id: 'inv_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.deduplicated).toBe(true)
    expect(body.invoice.id).toBe('inv_existing_1')
    expect(prisma.prisma.invoice.findFirst).not.toHaveBeenCalled()
    expect(prisma.prisma.invoice.update).not.toHaveBeenCalled()
  })
})
