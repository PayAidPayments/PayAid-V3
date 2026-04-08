import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createInvoice } from '@/apps/dashboard/app/api/invoices/route'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    invoice: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    tenant: { findUnique: jest.fn() },
    contact: { findFirst: jest.fn() },
  },
}))

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/middleware/tenant', () => ({
  checkTenantLimits: jest.fn(),
}))

jest.mock('@/lib/invoicing/gst', () => ({
  calculateGST: jest.fn(),
  getGSTRate: jest.fn(),
  getHSNCode: jest.fn(),
}))

jest.mock('@/lib/invoicing/gst-state', () => ({
  determineGSTType: jest.fn(),
}))

jest.mock('@/lib/invoicing/pdf', () => ({
  generateInvoicePDF: jest.fn(),
}))

jest.mock('@/lib/cache/multi-layer', () => ({
  multiLayerCache: {
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  },
}))

jest.mock('@/lib/workflow/trigger', () => ({
  triggerWorkflowsByEvent: jest.fn(),
}))

jest.mock('@/lib/audit/log', () => ({
  logAudit: jest.fn(),
}))

jest.mock('@/lib/queue/bull', () => ({
  mediumPriorityQueue: { add: jest.fn() },
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

describe('invoices create duplicate-submission protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns deduplicated invoice when x-idempotency-key is reused', async () => {
    const auth = require('@/lib/middleware/auth')
    const tenant = require('@/lib/middleware/tenant')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')

    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    tenant.checkTenantLimits.mockResolvedValue(true)
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_inv_1',
      afterSnapshot: { invoice_id: 'inv_existing_1' },
    })

    const req = new NextRequest('http://localhost/api/invoices', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_invoice_key',
      },
      body: JSON.stringify({
        customerName: 'Acme Corp',
        items: [{ description: 'Service', quantity: 1, rate: 5000 }],
      }),
    })

    const res = await createInvoice(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toBe('inv_existing_1')
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.invoice.create).not.toHaveBeenCalled()
  })
})
