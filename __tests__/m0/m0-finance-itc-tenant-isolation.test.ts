import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as claimItc } from '@/apps/dashboard/app/api/finance/itc/claim/route'

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

describe('finance itc claim tenant isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects claim when invoice is not in authenticated tenant', async () => {
    const auth = require('@/lib/middleware/auth')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    prisma.prisma.invoice.findFirst.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/finance/itc/claim', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
      },
      body: JSON.stringify({
        tenantId: 'tn_2',
        invoiceId: 'inv_1',
        supplierReturnFiled: true,
        ledgerMatched: true,
      }),
    })

    const res = await claimItc(req)
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error).toContain('Invoice not found')
    expect(prisma.prisma.invoice.update).not.toHaveBeenCalled()
  })
})
