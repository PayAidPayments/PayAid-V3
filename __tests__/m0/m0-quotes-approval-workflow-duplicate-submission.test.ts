import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createApprovalWorkflow } from '@/apps/dashboard/app/api/quotes/[id]/approval-workflow/route'

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

describe('quote approval-workflow duplicate-submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns deduplicated response for repeated idempotency key', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    const m0Service = require('@/lib/ai-native/m0-service')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_quote_appr_1',
      afterSnapshot: { quoteId: 'quote_1', approvalCount: 2 },
    })

    const req = new NextRequest('http://localhost/api/quotes/quote_1/approval-workflow', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_quote_approval_key',
      },
      body: JSON.stringify({
        workflow: [
          { approverId: 'u1', approverName: 'A', approverEmail: 'a@example.com', order: 1 },
          { approverId: 'u2', approverName: 'B', approverEmail: 'b@example.com', order: 2 },
        ],
      }),
    })

    const res = await createApprovalWorkflow(req, { params: Promise.resolve({ id: 'quote_1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.deduplicated).toBe(true)
    expect(body.data.quoteId).toBe('quote_1')
    expect(body.data.approvalCount).toBe(2)
    expect(prisma.prisma.quote.update).not.toHaveBeenCalled()
    expect(prisma.prisma.quoteApproval.create).not.toHaveBeenCalled()
  })
})
