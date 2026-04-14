import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const URGENCY_CRITICAL_RATIO = 0.25 // quantity <= 25% of reorder_level → critical

type UrgencyLevel = 'critical' | 'low' | 'normal'

function getUrgency(quantity: number, reorderLevel: number): UrgencyLevel {
  if (quantity <= 0) return 'critical'
  if (quantity <= reorderLevel * URGENCY_CRITICAL_RATIO) return 'critical'
  if (quantity <= reorderLevel * 0.5) return 'low'
  return 'normal'
}

const approveBodySchema = z.object({
  quantity_to_order: z.number().positive('quantity_to_order must be positive'),
  supplier_note: z.string().max(500).optional(),
})

/**
 * GET /api/v1/inventory/reorder-triggers
 *
 * Returns all InventoryLocation entries where `quantity <= reorderLevel`.
 * Used to surface items that need reordering in the Inventory dashboard.
 *
 * Query params:
 *   ?location_id=     filter by location
 *   ?urgency=critical|low|normal
 *   ?limit=50 (max 200)
 *   ?page=1
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')
    const url = new URL(request.url)

    const locationId = url.searchParams.get('location_id') ?? undefined
    const urgencyFilter = url.searchParams.get('urgency') ?? undefined
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200)
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      tenantId,
      // Items at or below their reorder level
      AND: [
        { reorderLevel: { not: null } },
        { quantity: { lte: prisma.inventoryLocation.fields?.reorderLevel } },
      ],
    }

    if (locationId) {
      where.locationId = locationId
    }

    // Use raw query construction that Prisma supports: quantity <= reorderLevel
    const rawItems = await prisma.inventoryLocation.findMany({
      where: {
        tenantId,
        ...(locationId ? { locationId } : {}),
        reorderLevel: { not: null },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
            salePrice: true,
            reorderLevel: true,
          },
        },
        location: {
          select: { id: true, name: true },
        },
      },
      orderBy: { quantity: 'asc' },
      take: limit * 4, // over-fetch to allow client-side urgency filter
      skip,
    })

    // Filter in-memory: only items where quantity <= their own reorderLevel
    const belowReorder = rawItems.filter(
      (item) => item.reorderLevel != null && item.quantity <= item.reorderLevel
    )

    const triggers = belowReorder
      .map((item) => {
        const rl = item.reorderLevel ?? item.product.reorderLevel
        const urgency = getUrgency(item.quantity, rl)
        const deficit = Math.max(0, rl - item.quantity)
        return {
          id: item.id,
          product_id: item.productId,
          product_name: item.product.name,
          sku: item.product.sku,
          location_id: item.locationId,
          location_name: item.location?.name ?? null,
          quantity_on_hand: item.quantity,
          reserved: item.reserved,
          available: item.quantity - item.reserved,
          reorder_level: rl,
          deficit,
          urgency,
          estimated_reorder_value: deficit * item.product.costPrice,
        }
      })
      .filter((t) => !urgencyFilter || t.urgency === urgencyFilter)
      .slice(0, limit)

    return NextResponse.json({
      triggers,
      total: triggers.length,
      has_critical: triggers.some((t) => t.urgency === 'critical'),
      generated_at: new Date().toISOString(),
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('Inventory reorder-triggers error:', e)
    return NextResponse.json({ error: 'Failed to compute reorder triggers' }, { status: 500 })
  }
}
