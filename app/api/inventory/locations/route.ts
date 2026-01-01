import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const updateInventorySchema = z.object({
  locationId: z.string(),
  quantity: z.number().int(),
  adjustmentReason: z.string().optional(),
})

// GET /api/inventory/locations - Get inventory by location
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const productId = searchParams.get('productId')
    const lowStock = searchParams.get('lowStock') === 'true'

    const where: any = { tenantId }
    if (locationId) where.locationId = locationId
    if (productId) where.productId = productId
    if (lowStock) {
      where.quantity = { lte: prisma.inventoryLocation.fields.reorderLevel }
    }

    const inventory = await prisma.inventoryLocation.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get inventory locations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory locations' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/locations - Update inventory quantity
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = updateInventorySchema.parse(body)

    const { productId, locationId, quantity, adjustmentReason } = body

    if (!productId || !locationId) {
      return NextResponse.json(
        { error: 'productId and locationId are required' },
        { status: 400 }
      )
    }

    // Upsert inventory location
    const inventory = await prisma.inventoryLocation.upsert({
      where: {
        tenantId_productId_locationId: {
          tenantId,
          productId,
          locationId,
        },
      },
      update: {
        quantity: validated.quantity,
      },
      create: {
        tenantId,
        productId,
        locationId,
        quantity: validated.quantity,
      },
      include: {
        product: true,
        location: true,
      },
    })

    // Update main product quantity (sum of all locations)
    const totalQuantity = await prisma.inventoryLocation.aggregate({
      where: { tenantId, productId },
      _sum: { quantity: true },
    })

    await prisma.product.update({
      where: { id: productId },
      data: {
        quantity: totalQuantity._sum.quantity || 0,
      },
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update inventory location error:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory location' },
      { status: 500 }
    )
  }
}

