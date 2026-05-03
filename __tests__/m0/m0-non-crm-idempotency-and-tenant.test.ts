import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as createFinanceInvoice } from '@/apps/dashboard/app/api/finance/invoices/route'
import { POST as createProposal } from '@/apps/dashboard/app/api/proposals/route'
import { POST as sendPaymentReminder } from '@/apps/dashboard/app/api/finance/payment-reminders/route'
import { POST as mergeInvoices } from '@/apps/dashboard/app/api/invoices/merge/route'
import { POST as approveContract } from '@/apps/dashboard/app/api/contracts/[id]/approve/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/middleware/license', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn((error: unknown) => error),
}))

jest.mock('@/lib/ai-native/m0-service', () => ({
  findIdempotentRequest: jest.fn(),
  markIdempotentRequest: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    invoice: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    proposal: {
      create: jest.fn(),
    },
    contact: {
      findFirst: jest.fn(),
    },
    activityFeed: {
      create: jest.fn(),
    },
    contract: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contractApproval: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('Non-CRM idempotency and tenant guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deduplicates finance invoice create', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_fin_inv_1',
      afterSnapshot: { invoice_id: 'inv_existing_1' },
    })

    const req = new NextRequest('http://localhost/api/finance/invoices', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_fin_inv_1',
      },
      body: JSON.stringify({}),
    })

    const res = await createFinanceInvoice(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.invoice.create).not.toHaveBeenCalled()
  })

  it('deduplicates proposal create', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_prop_1',
      afterSnapshot: { proposal_id: 'prop_existing_1' },
    })

    const req = new NextRequest('http://localhost/api/proposals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_prop_1',
      },
      body: JSON.stringify({}),
    })

    const res = await createProposal(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.proposal.create).not.toHaveBeenCalled()
  })

  it('deduplicates payment reminder send', async () => {
    const license = require('@/lib/middleware/license')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_reminder_1',
      afterSnapshot: { reminder_sent: true },
    })

    const req = new NextRequest('http://localhost/api/finance/payment-reminders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_reminder_1',
      },
      body: JSON.stringify({ invoiceId: 'inv_1', channel: 'email' }),
    })

    const res = await sendPaymentReminder(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(prisma.prisma.activityFeed.create).not.toHaveBeenCalled()
  })

  it('deduplicates invoice merge', async () => {
    const auth = require('@/lib/middleware/auth')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_merge_1',
      afterSnapshot: { merged_invoice_id: 'inv_merged_1' },
    })

    const req = new NextRequest('http://localhost/api/invoices/merge', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_merge_1',
      },
      body: JSON.stringify({ invoiceIds: ['a', 'b'] }),
    })

    const res = await mergeInvoices(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.data.mergedInvoiceId).toBe('inv_merged_1')
    expect(prisma.prisma.invoice.findMany).not.toHaveBeenCalled()
  })

  it('deduplicates contract approval', async () => {
    const license = require('@/lib/middleware/license')
    const m0Service = require('@/lib/ai-native/m0-service')
    const prisma = require('@/lib/db/prisma')
    license.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    m0Service.findIdempotentRequest.mockResolvedValue({
      id: 'idem_cap_1',
      afterSnapshot: {
        approval_id: 'appr_1',
        payload: {
          approval: { id: 'appr_1' },
          message: 'Contract approved',
          contractStatus: 'PENDING_SIGNATURE',
          allApproved: true,
        },
      },
    })

    const req = new NextRequest('http://localhost/api/contracts/c1/approve', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
        'x-idempotency-key': 'dup_cap_1',
      },
      body: JSON.stringify({ action: 'APPROVE' }),
    })

    const res = await approveContract(req, { params: Promise.resolve({ id: 'c1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.deduplicated).toBe(true)
    expect(body.message).toBe('Contract approved')
    expect(prisma.prisma.contract.findUnique).not.toHaveBeenCalled()
  })
})
