/**
 * M2 smoke — /api/v1/quotes (GET + POST),
 *             /api/v1/quotes/[id]/approve,
 *             /api/v1/quotes/[id]/convert-invoice
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as listQuotes, POST as createQuote } from '@/apps/dashboard/app/api/v1/quotes/route'
import { POST as approveQuote } from '@/apps/dashboard/app/api/v1/quotes/[id]/approve/route'
import { POST as convertQuote } from '@/apps/dashboard/app/api/v1/quotes/[id]/convert-invoice/route'

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

jest.mock('@/lib/middleware/permissions', () => ({
  assertAnyPermission: jest.fn(),
  PermissionDeniedError: class PermissionDeniedError extends Error {
    constructor(msg?: string) { super(msg ?? 'Permission denied') }
  },
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    quote: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    deal: { findFirst: jest.fn() },
    invoice: { create: jest.fn() },
    auditLog: {
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'al_1', snapshot: {} }),
    },
  },
}))

function makeReq(url: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
}

const sampleQuote = {
  id: 'q_1',
  quoteNumber: 'Q-20260408-ABCD',
  tenantId: 'tn_1',
  dealId: 'd_1',
  contactId: 'c_1',
  status: 'draft',
  subtotal: 100000,
  discount: 0,
  tax: 18000,
  total: 118000,
  validUntil: null,
  notes: null,
  lineItems: [],
  deal: { id: 'd_1', name: 'Big Deal', value: 200000, stage: 'Proposal' },
  contact: { id: 'c_1', name: 'Ravi Kumar', email: 'ravi@example.com' },
  createdAt: new Date('2026-04-08'),
  updatedAt: new Date('2026-04-08'),
}

const sampleDeal = {
  id: 'd_1',
  tenantId: 'tn_1',
  name: 'Big Deal',
  contactId: 'c_1',
  contact: { id: 'c_1', name: 'Ravi Kumar', email: 'ravi@example.com' },
}

// ─── GET /api/v1/quotes ───────────────────────────────────────────────────

describe('GET /api/v1/quotes (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 with quotes list', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.quote.findMany.mockResolvedValue([sampleQuote])
    db.prisma.quote.count.mockResolvedValue(1)

    const res = await listQuotes(makeReq('/api/v1/quotes'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.quotes).toHaveLength(1)
    expect(body.quotes[0].id).toBe('q_1')
    expect(body.pagination.total).toBe(1)
  })

  it('returns 500 on list failure', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.quote.findMany.mockRejectedValue(new Error('db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await listQuotes(makeReq('/api/v1/quotes'))
    expect(res.status).toBe(500)
    spy.mockRestore()
  })

  it('returns 403 when module access is denied by license handler', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await listQuotes(makeReq('/api/v1/quotes'))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── POST /api/v1/quotes ──────────────────────────────────────────────────

describe('POST /api/v1/quotes (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a quote and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.deal.findFirst.mockResolvedValue(sampleDeal)
    db.prisma.quote.create.mockResolvedValue(sampleQuote)

    const res = await createQuote(
      makeReq('/api/v1/quotes', 'POST', {
        deal_id: 'd_1',
        line_items: [{ description: 'PayAid Pro Annual', quantity: 1, unit_price: 100000 }],
      })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.quote.id).toBe('q_1')
    expect(body.quote.status).toBe('draft')
  })

  it('returns 404 when deal not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    db.prisma.deal.findFirst.mockResolvedValue(null)

    const res = await createQuote(
      makeReq('/api/v1/quotes', 'POST', {
        deal_id: 'no_deal',
        line_items: [{ description: 'Item', quantity: 1, unit_price: 1000 }],
      })
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for missing line_items', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })

    const res = await createQuote(
      makeReq('/api/v1/quotes', 'POST', { deal_id: 'd_1' })
    )
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 403 when module access is denied by license handler (POST)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await createQuote(
      makeReq('/api/v1/quotes', 'POST', {
        deal_id: 'd_1',
        line_items: [{ description: 'Item', quantity: 1, unit_price: 1000 }],
      })
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── POST /api/v1/quotes/[id]/approve ─────────────────────────────────────

describe('POST /api/v1/quotes/[id]/approve (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('approves a quote and returns 200', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue(sampleQuote)
    db.prisma.quote.update.mockResolvedValue({ ...sampleQuote, status: 'approved' })

    const res = await approveQuote(
      makeReq('/api/v1/quotes/q_1/approve', 'POST', {
        decision: 'approved',
        approver_note: 'Looks good',
      }),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.quote.decision).toBe('approved')
    expect(body.quote.status).toBe('approved')
  })

  it('rejects a quote and returns 200', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue(sampleQuote)
    db.prisma.quote.update.mockResolvedValue({ ...sampleQuote, status: 'rejected' })

    const res = await approveQuote(
      makeReq('/api/v1/quotes/q_1/approve', 'POST', {
        decision: 'rejected',
        reason: 'Price too high',
      }),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.quote.decision).toBe('rejected')
  })

  it('returns 404 when quote not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue(null)

    const res = await approveQuote(
      makeReq('/api/v1/quotes/no_q/approve', 'POST', { decision: 'approved' }),
      { params: Promise.resolve({ id: 'no_q' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns 422 when quote status disallows approval', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue({ ...sampleQuote, status: 'converted' })

    const res = await approveQuote(
      makeReq('/api/v1/quotes/q_1/approve', 'POST', { decision: 'approved' }),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('INVALID_STATE_TRANSITION')
  })

  it('returns 400 for invalid decision value', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    // Must have approvable status so Zod body validation is reached
    db.prisma.quote.findFirst.mockResolvedValue({ ...sampleQuote, status: 'draft' })

    const res = await approveQuote(
      makeReq('/api/v1/quotes/q_1/approve', 'POST', { decision: 'maybe' }),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    expect(res.status).toBe(400)
  })

  it('returns 403 when module access is denied by license handler (approve)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await approveQuote(
      makeReq('/api/v1/quotes/q_1/approve', 'POST', { decision: 'approved' }),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── POST /api/v1/quotes/[id]/convert-invoice ─────────────────────────────

describe('POST /api/v1/quotes/[id]/convert-invoice (M2 smoke)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('converts an approved quote to invoice and returns 201', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue({ ...sampleQuote, status: 'approved' })
    db.prisma.auditLog.findFirst.mockResolvedValue(null) // not yet converted
    db.prisma.invoice.create.mockResolvedValue({
      id: 'inv_1',
      invoiceNumber: 'INV-20260408-XYZ',
      status: 'draft',
      total: 118000,
      createdAt: new Date(),
    })
    db.prisma.quote.update.mockResolvedValue({ ...sampleQuote, status: 'converted' })

    const res = await convertQuote(
      makeReq('/api/v1/quotes/q_1/convert-invoice', 'POST'),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.conversion.invoice_id).toBe('inv_1')
    expect(body.conversion.invoice_status).toBe('draft')
  })

  it('returns 422 when quote is not approved', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue({ ...sampleQuote, status: 'draft' })

    const res = await convertQuote(
      makeReq('/api/v1/quotes/q_1/convert-invoice', 'POST'),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('QUOTE_NOT_APPROVED')
  })

  it('returns 409 when quote is already converted', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue({ ...sampleQuote, status: 'approved' })
    db.prisma.auditLog.findFirst.mockResolvedValue({
      id: 'al_existing', afterSnapshot: { invoice_id: 'inv_old' },
    })

    const res = await convertQuote(
      makeReq('/api/v1/quotes/q_1/convert-invoice', 'POST'),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.code).toBe('ALREADY_CONVERTED')
    expect(body.invoice_id).toBe('inv_old')
  })

  it('returns 404 when quote not found', async () => {
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'u1' })
    db.prisma.quote.findFirst.mockResolvedValue(null)

    const res = await convertQuote(
      makeReq('/api/v1/quotes/no_q/convert-invoice', 'POST'),
      { params: Promise.resolve({ id: 'no_q' }) }
    )
    expect(res.status).toBe(404)
  })

  it('returns 403 when module access is denied by license handler (convert-invoice)', async () => {
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockRejectedValue(new Error('license denied'))
    auth.handleLicenseError.mockReturnValueOnce(
      new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    )

    const res = await convertQuote(
      makeReq('/api/v1/quotes/q_1/convert-invoice', 'POST'),
      { params: Promise.resolve({ id: 'q_1' }) }
    )
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})

// ─── Feature flag gate (m2_cpq) ─────────────────────────────────────────

describe('M2 feature flag gate — m2_cpq', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 FEATURE_DISABLED when m2_cpq is disabled on GET /quotes', async () => {
    const auth = require('@/lib/middleware/auth')
    const ff = require('@/lib/feature-flags/tenant-feature')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1', userId: 'usr_1' })
    ff.assertTenantFeatureEnabled.mockRejectedValueOnce(
      new ff.TenantFeatureDisabledError('m2_cpq')
    )
    const res = await listQuotes(makeReq('/api/v1/quotes', 'GET'))
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.code).toBe('FEATURE_DISABLED')
  })
})
