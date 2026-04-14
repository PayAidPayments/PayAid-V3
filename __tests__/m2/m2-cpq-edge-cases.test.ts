/**
 * M2 CPQ edge-case tests
 * Covers: /api/v1/quotes/[id]/convert-invoice and /api/crm/cpq/quotes/[id]/convert-invoice
 * Edge cases: multi-line items, mixed GST rates (0%, 12%, 18%, 28%),
 *             100% discount, zero-value line items, idempotency (409 / already-converted),
 *             deal/contact FK propagation, and notes default.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as convertV1 } from '@/apps/dashboard/app/api/v1/quotes/[id]/convert-invoice/route'
import { POST as convertCpq } from '@/apps/dashboard/app/api/crm/cpq/quotes/[id]/convert-invoice/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/feature-flags/tenant-feature', () => ({
  assertTenantFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  TenantFeatureDisabledError: class TenantFeatureDisabledError extends Error {
    constructor(public featureName: string) {
      super(`Feature "${featureName}" is disabled`)
      this.name = 'TenantFeatureDisabledError'
    }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    quote: {
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(5),
    },
    invoice: { create: jest.fn(), count: jest.fn().mockResolvedValue(3), findFirst: jest.fn() },
    auditLog: {
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'al_new' }),
    },
  },
}))

function makeReq(url: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

// ─── Shared quote fixtures ──────────────────────────────────────────────────

const baseQuote = {
  id: 'q_1',
  tenantId: 'tn_1',
  dealId: 'd_1',
  contactId: 'c_1',
  quoteNumber: 'Q-20260408-0001',
  status: 'accepted',
  validUntil: null,
  notes: null,
  convertedInvoiceId: null,
  convertedAt: null,
  deal: { id: 'd_1', name: 'Big Deal', contactId: 'c_1' },
  contact: { id: 'c_1', name: 'Ravi', email: 'ravi@example.com' },
}

const sampleInvoice = {
  id: 'inv_1',
  invoiceNumber: 'INV-CPQ-00004',
  status: 'draft',
  total: 118000,
  createdAt: new Date('2026-04-08T10:00:00Z'),
}

// ─── Helper to build a quote with computed totals ──────────────────────────

function quoteWithItems(
  lineItems: {
    name: string
    quantity: number
    unitPrice: number
    taxRate: number
    discountRate: number
    total: number
  }[]
) {
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0)
  const discount = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice * li.discountRate, 0)
  const tax = lineItems.reduce(
    (s, li) => s + li.quantity * li.unitPrice * (1 - li.discountRate) * li.taxRate,
    0
  )
  const total = subtotal - discount + tax
  return { ...baseQuote, lineItems, subtotal, discount, tax, total }
}

// ─── /api/v1/quotes/[id]/convert-invoice ───────────────────────────────────

describe('POST /api/v1/quotes/[id]/convert-invoice — edge cases', () => {
  beforeEach(() => jest.resetAllMocks())

  it('handles multi-line items with mixed GST rates (0%, 12%, 18%, 28%)', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const lineItems = [
      { name: 'Unprocessed food',  quantity: 100, unitPrice: 100,  taxRate: 0,    discountRate: 0,    total: 10000 },
      { name: 'Restaurant service',quantity: 10,  unitPrice: 5000, taxRate: 0.12, discountRate: 0,    total: 56000 },
      { name: 'PayAid Pro Annual', quantity: 1,   unitPrice: 100000,taxRate: 0.18, discountRate: 0,   total: 118000 },
      { name: 'Luxury goods',      quantity: 2,   unitPrice: 10000, taxRate: 0.28, discountRate: 0.1, total: 25600 },
    ]
    const q = quoteWithItems(lineItems)

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.auditLog.findFirst.mockResolvedValue(null)
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, total: q.total })
    db.prisma.quote.update.mockResolvedValue({ ...q, status: 'converted' })
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })

    const res = await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.conversion.invoice_id).toBe('inv_1')
    expect(body.conversion.invoice_status).toBe('draft')
    // Invoice should be created with 4 line items
    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    expect(createCall.data.items.create).toHaveLength(4)
  })

  it('handles 0% tax (basic items) — no tax added to total', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const lineItems = [
      { name: 'Essential food', quantity: 500, unitPrice: 50, taxRate: 0, discountRate: 0, total: 25000 },
    ]
    const q = quoteWithItems(lineItems)
    expect(q.tax).toBe(0)
    expect(q.total).toBe(25000)

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.auditLog.findFirst.mockResolvedValue(null)
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, total: 25000 })
    db.prisma.quote.update.mockResolvedValue({ ...q, status: 'converted' })
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })

    const res = await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(201)
    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    expect(createCall.data.tax).toBe(0)
  })

  it('handles 100% discount — total equals tax on zero effective price', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const lineItems = [
      { name: 'Complimentary plan', quantity: 1, unitPrice: 50000, taxRate: 0.18, discountRate: 1, total: 0 },
    ]
    const q = quoteWithItems(lineItems)
    expect(q.subtotal).toBe(50000)
    expect(q.discount).toBe(50000)
    expect(q.tax).toBe(0) // 18% on (50000 * (1 - 1)) = 0
    expect(q.total).toBe(0)

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.auditLog.findFirst.mockResolvedValue(null)
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, total: 0 })
    db.prisma.quote.update.mockResolvedValue({ ...q, status: 'converted' })
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })

    const res = await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })

    expect(res.status).toBe(201)
    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    expect(createCall.data.discount).toBe(50000)
    expect(createCall.data.total).toBe(0)
  })

  it('returns 409 ALREADY_CONVERTED if AuditLog conversion record exists', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    db.prisma.quote.findFirst.mockResolvedValue({ ...baseQuote, lineItems: [] })
    db.prisma.auditLog.findFirst.mockResolvedValue({
      id: 'al_existing',
      afterSnapshot: { invoice_id: 'inv_existing', invoice_number: 'INV-OLD' },
    })

    const res = await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.code).toBe('ALREADY_CONVERTED')
    expect(body.invoice_id).toBe('inv_existing')
    expect(db.prisma.invoice.create).not.toHaveBeenCalled()
  })

  it('returns 422 QUOTE_NOT_APPROVED for draft quote', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue({ ...baseQuote, status: 'draft', lineItems: [] })

    const res = await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('QUOTE_NOT_APPROVED')
  })

  it('uses deal contactId when quote has no direct contactId', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const lineItems = [{ name: 'Plan', quantity: 1, unitPrice: 10000, taxRate: 0.18, discountRate: 0, total: 11800 }]
    const q = { ...quoteWithItems(lineItems), contactId: null }

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.auditLog.findFirst.mockResolvedValue(null)
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, total: 11800 })
    db.prisma.quote.update.mockResolvedValue({ ...q, status: 'converted' })
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })

    await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })

    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    // Should fall back to deal.contactId
    expect(createCall.data.contactId).toBe('c_1')
  })

  it('sets notes default to "Converted from quote {quoteNumber}" when not provided', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const lineItems = [{ name: 'Service', quantity: 1, unitPrice: 5000, taxRate: 0, discountRate: 0, total: 5000 }]
    const q = quoteWithItems(lineItems)

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.auditLog.findFirst.mockResolvedValue(null)
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, total: 5000 })
    db.prisma.quote.update.mockResolvedValue({ ...q, status: 'converted' })
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })

    await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })

    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    expect(createCall.data.notes).toContain('Q-20260408-0001')
  })

  it('respects custom notes when provided', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const lineItems = [{ name: 'Service', quantity: 1, unitPrice: 5000, taxRate: 0, discountRate: 0, total: 5000 }]
    const q = quoteWithItems(lineItems)

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.auditLog.findFirst.mockResolvedValue(null)
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, total: 5000 })
    db.prisma.quote.update.mockResolvedValue({ ...q, status: 'converted' })
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })

    await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice', { notes: 'Custom note for finance' }), {
      params: Promise.resolve({ id: 'q_1' }),
    })

    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    expect(createCall.data.notes).toBe('Custom note for finance')
  })

  it('sets dueDate to 30 days from now when not provided', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })

    const lineItems = [{ name: 'Service', quantity: 1, unitPrice: 5000, taxRate: 0, discountRate: 0, total: 5000 }]
    const q = quoteWithItems(lineItems)

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.auditLog.findFirst.mockResolvedValue(null)
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, total: 5000 })
    db.prisma.quote.update.mockResolvedValue({ ...q, status: 'converted' })
    db.prisma.auditLog.create.mockResolvedValue({ id: 'al_1' })

    const before = Date.now()
    await convertV1(makeReq('/api/v1/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })
    const after = Date.now()

    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    const dueDate: Date = createCall.data.dueDate
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    expect(dueDate.getTime()).toBeGreaterThanOrEqual(before + thirtyDaysMs - 1000)
    expect(dueDate.getTime()).toBeLessThanOrEqual(after + thirtyDaysMs + 1000)
  })
})

// ─── /api/crm/cpq/quotes/[id]/convert-invoice ──────────────────────────────

describe('POST /api/crm/cpq/quotes/[id]/convert-invoice — edge cases', () => {
  beforeEach(() => jest.resetAllMocks())

  it('converts accepted quote and creates invoice from line items', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })

    const lineItems = [
      { name: 'PayAid Pro', quantity: 2, unitPrice: 50000, taxRate: 0.18, discountRate: 0.05, total: 99900 },
      { name: 'Onboarding',  quantity: 1, unitPrice: 10000, taxRate: 0,    discountRate: 0,    total: 10000 },
    ]
    const q = quoteWithItems(lineItems)

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.invoice.count.mockResolvedValue(10)
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, total: q.total })
    db.prisma.invoice.findFirst.mockResolvedValue(null)
    db.prisma.quote.update.mockResolvedValue({ ...q, convertedInvoiceId: 'inv_1' })

    const res = await convertCpq(makeReq('/api/crm/cpq/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.invoice.id).toBe('inv_1')
    // Verify 2 line items were mapped
    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    expect(createCall.data.items.create).toHaveLength(2)
  })

  it('returns 422 if status is not accepted', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.quote.findFirst.mockResolvedValue({ ...baseQuote, status: 'sent', lineItems: [] })

    const res = await convertCpq(makeReq('/api/crm/cpq/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('QUOTE_NOT_ACCEPTED')
  })

  it('returns already_converted: true if convertedInvoiceId is already set', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.quote.findFirst.mockResolvedValue({
      ...baseQuote,
      lineItems: [],
      convertedInvoiceId: 'inv_existing',
    })
    db.prisma.invoice.findFirst.mockResolvedValue({
      id: 'inv_existing',
      invoiceNumber: 'INV-CPQ-00001',
      status: 'sent',
      total: 100000,
      createdAt: new Date(),
    })

    const res = await convertCpq(makeReq('/api/crm/cpq/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.already_converted).toBe(true)
    expect(body.invoice.id).toBe('inv_existing')
  })

  it('generates sequential INV-CPQ invoice number', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })

    const lineItems = [{ name: 'Item', quantity: 1, unitPrice: 1000, taxRate: 0, discountRate: 0, total: 1000 }]
    const q = quoteWithItems(lineItems)

    db.prisma.quote.findFirst.mockResolvedValue(q)
    db.prisma.invoice.count.mockResolvedValue(4) // 4 existing invoices → INV-CPQ-00005
    db.prisma.invoice.create.mockResolvedValue({ ...sampleInvoice, invoiceNumber: 'INV-CPQ-00005' })
    db.prisma.invoice.findFirst.mockResolvedValue(null)
    db.prisma.quote.update.mockResolvedValue({ ...q, convertedInvoiceId: 'inv_1' })

    await convertCpq(makeReq('/api/crm/cpq/quotes/q_1/convert-invoice'), {
      params: Promise.resolve({ id: 'q_1' }),
    })

    const createCall = (db.prisma.invoice.create as jest.Mock).mock.calls[0][0] as any
    expect(createCall.data.invoiceNumber).toBe('INV-CPQ-00005')
  })
})

