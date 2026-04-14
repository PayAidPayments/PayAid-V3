/**
 * M3 smoke — GET /api/v1/inventory/reorder-triggers
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getReorderTriggers } from '@/apps/dashboard/app/api/v1/inventory/reorder-triggers/route'

jest.mock('@/lib/middleware/auth', () => ({
  requireModuleAccess: jest.fn(),
  handleLicenseError: jest.fn(() => null),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    inventoryLocation: {
      findMany: jest.fn(),
      fields: undefined,
    },
  },
}))

const SAMPLE_ITEMS = [
  {
    id: 'invloc_1',
    productId: 'prod_1',
    locationId: 'loc_1',
    quantity: 3,
    reserved: 0,
    reorderLevel: 10,
    product: { id: 'prod_1', name: 'Laptop', sku: 'LAP001', costPrice: 50000, salePrice: 65000, reorderLevel: 10 },
    location: { id: 'loc_1', name: 'Warehouse A' },
  },
  {
    id: 'invloc_2',
    productId: 'prod_2',
    locationId: 'loc_1',
    quantity: 8,
    reserved: 2,
    reorderLevel: 15,
    product: { id: 'prod_2', name: 'Mouse', sku: 'MOU001', costPrice: 500, salePrice: 800, reorderLevel: 15 },
    location: { id: 'loc_1', name: 'Warehouse A' },
  },
  // This item is ABOVE reorder level — should NOT appear in results
  {
    id: 'invloc_3',
    productId: 'prod_3',
    locationId: 'loc_1',
    quantity: 50,
    reserved: 0,
    reorderLevel: 10,
    product: { id: 'prod_3', name: 'Keyboard', sku: 'KEY001', costPrice: 1200, salePrice: 1800, reorderLevel: 10 },
    location: { id: 'loc_1', name: 'Warehouse A' },
  },
]

function makeReq(qs = '') {
  return new NextRequest(`http://localhost/api/v1/inventory/reorder-triggers${qs}`, {
    headers: { authorization: 'Bearer t' },
  })
}

describe('GET /api/v1/inventory/reorder-triggers (M3 smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const auth = require('@/lib/middleware/auth')
    const db = require('@/lib/db/prisma')
    auth.requireModuleAccess.mockResolvedValue({ tenantId: 'tn_1' })
    auth.handleLicenseError.mockReturnValue(null)
    db.prisma.inventoryLocation.findMany.mockResolvedValue(SAMPLE_ITEMS)
  })

  it('returns 200 with only items below reorder level', async () => {
    const res = await getReorderTriggers(makeReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    // Only prod_1 (qty 3 <= rl 10) and prod_2 (qty 8 <= rl 15) qualify
    expect(json.triggers).toHaveLength(2)
    const skus = json.triggers.map((t: { sku: string }) => t.sku)
    expect(skus).toContain('LAP001')
    expect(skus).toContain('MOU001')
    expect(skus).not.toContain('KEY001')
  })

  it('marks critical when quantity is very low', async () => {
    const res = await getReorderTriggers(makeReq())
    const json = await res.json()
    const laptop = json.triggers.find((t: { sku: string }) => t.sku === 'LAP001')
    // qty=3, rl=10, 3 <= 10*0.25=2.5 → not critical; 3 <= 10*0.5=5 → 'low'
    expect(laptop.urgency).toBe('low')
    expect(json.has_critical).toBe(false)
  })

  it('includes deficit and estimated_reorder_value', async () => {
    const res = await getReorderTriggers(makeReq())
    const json = await res.json()
    const laptop = json.triggers.find((t: { sku: string }) => t.sku === 'LAP001')
    expect(laptop.deficit).toBe(7) // rl=10, qty=3
    expect(laptop.estimated_reorder_value).toBe(7 * 50000) // deficit * costPrice
  })

  it('returns critical urgency when quantity is zero', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findMany.mockResolvedValue([
      { ...SAMPLE_ITEMS[0], quantity: 0 },
    ])
    const res = await getReorderTriggers(makeReq())
    const json = await res.json()
    expect(json.triggers[0].urgency).toBe('critical')
    expect(json.has_critical).toBe(true)
  })

  it('returns 200 with empty list when no items below reorder level', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findMany.mockResolvedValue([SAMPLE_ITEMS[2]]) // only above-reorder item
    const res = await getReorderTriggers(makeReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.triggers).toHaveLength(0)
  })

  it('filters by urgency query param', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findMany.mockResolvedValue([
      { ...SAMPLE_ITEMS[0], quantity: 0 }, // critical
      SAMPLE_ITEMS[1],                       // low
    ])
    const res = await getReorderTriggers(makeReq('?urgency=critical'))
    const json = await res.json()
    expect(json.triggers.every((t: { urgency: string }) => t.urgency === 'critical')).toBe(true)
  })

  it('returns 500 on unexpected DB error', async () => {
    const db = require('@/lib/db/prisma')
    db.prisma.inventoryLocation.findMany.mockRejectedValue(new Error('DB error'))
    const res = await getReorderTriggers(makeReq())
    expect(res.status).toBe(500)
  })
})
