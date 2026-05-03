/**
 * M3 smoke — POST /api/v1/inventory/reorder-triggers/[id]/approve
 *
 * Approves a reorder trigger, emits AuditLog (entityType: 'reorder_request'),
 * and optionally creates a DRAFT PurchaseOrder when vendor_id is supplied.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as approveReorder } from '@/apps/dashboard/app/api/v1/inventory/reorder-triggers/[id]/approve/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    inventoryLocation: { findFirst: jest.fn() },
    vendor: { findFirst: jest.fn() },
    purchaseOrder: { create: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue(undefined) },
  },
}))

const SAMPLE_TRIGGER = {
  id: 'invloc_1',
  productId: 'prod_1',
  locationId: 'loc_1',
  quantity: 3,
  reserved: 0,
  reorderLevel: 10,
  product: { id: 'prod_1', name: 'Laptop Pro', sku: 'LAP001', costPrice: 50000 },
  location: { id: 'loc_1', name: 'Warehouse A' },
}

function makeReq(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/v1/inventory/reorder-triggers/${id}/approve`, {
    method: 'POST',
    headers: { authorization: 'Bearer t', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/inventory/reorder-triggers/[id]/approve (M3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_m3', userId: 'usr_1' })
  })

  it('returns 201 with approved reorder details (no PO)', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findFirst.mockResolvedValue(SAMPLE_TRIGGER)

    const req = makeReq('invloc_1', { quantity_to_order: 20 })
    const res = await approveReorder(req, { params: { id: 'invloc_1' } })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.trigger_id).toBe('invloc_1')
    expect(body.product_id).toBe('prod_1')
    expect(body.product_name).toBe('Laptop Pro')
    expect(body.quantity_approved).toBe(20)
    expect(body.status).toBe('approved')
    expect(body.po_draft).toBeNull()
    expect(body.approved_at).toBeDefined()
  })

  it('creates a DRAFT PurchaseOrder when vendor_id is supplied', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findFirst.mockResolvedValue(SAMPLE_TRIGGER)
    db.prisma.vendor.findFirst.mockResolvedValue({ id: 'ven_1' })
    db.prisma.purchaseOrder.create.mockResolvedValue({ id: 'po_1', poNumber: 'PO-REORDER-12345' })

    const req = makeReq('invloc_1', { quantity_to_order: 20, vendor_id: 'ven_1', supplier_note: 'Urgent' })
    const res = await approveReorder(req, { params: { id: 'invloc_1' } })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.po_draft).not.toBeNull()
    expect(body.po_draft.po_id).toBe('po_1')
    expect(body.po_draft.po_number).toBe('PO-REORDER-12345')
    expect(db.prisma.purchaseOrder.create).toHaveBeenCalledTimes(1)
  })

  it('returns 404 when trigger is not found', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findFirst.mockResolvedValue(null)

    const req = makeReq('invloc_missing', { quantity_to_order: 10 })
    const res = await approveReorder(req, { params: { id: 'invloc_missing' } })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 404 when vendor is not found in the tenant', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findFirst.mockResolvedValue(SAMPLE_TRIGGER)
    db.prisma.vendor.findFirst.mockResolvedValue(null)

    const req = makeReq('invloc_1', { quantity_to_order: 10, vendor_id: 'ven_unknown' })
    const res = await approveReorder(req, { params: { id: 'invloc_1' } })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toMatch(/vendor/i)
  })

  it('returns 400 on validation error (missing quantity_to_order)', async () => {
    const req = makeReq('invloc_1', { supplier_note: 'Only a note, no qty' })
    const res = await approveReorder(req, { params: { id: 'invloc_1' } })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 400 when quantity_to_order is non-positive', async () => {
    const req = makeReq('invloc_1', { quantity_to_order: -5 })
    const res = await approveReorder(req, { params: { id: 'invloc_1' } })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 500 on unexpected DB error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findFirst.mockRejectedValue(new Error('db failure'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = makeReq('invloc_1', { quantity_to_order: 10 })
    const res = await approveReorder(req, { params: { id: 'invloc_1' } })

    expect(res.status).toBe(500)
    spy.mockRestore()
  })
})
