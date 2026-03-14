import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createStockMovementSchema = z.object({
  productId: z.string(),
  locationId: z.string(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
})

// GET /api/inventory/stock-movements - List all stock movements
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')
    const locationId = searchParams.get('locationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query for stock transfers (these represent movements)
    const where: any = { tenantId }

    if (type) {
      // Map type to transfer direction
      if (type === 'IN') {
        where.toLocationId = locationId || undefined
      } else if (type === 'OUT') {
        where.fromLocationId = locationId || undefined
      }
    }

    if (productId) {
      where.productId = productId
    }

    if (locationId && !type) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          fromLocation: {
            select: {
              id: true,
              name: true,
            },
          },
          toLocation: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockTransfer.count({ where }),
    ])

    // Transform transfers into stock movements format
    const movements = transfers.map((transfer) => {
      // Determine movement type based on transfer
      let movementType: 'IN' | 'OUT' | 'TRANSFER' = 'TRANSFER'
      let warehouseName = null

      if (transfer.fromLocationId && transfer.toLocationId) {
        movementType = 'TRANSFER'
        warehouseName = `${transfer.fromLocation?.name} → ${transfer.toLocation?.name}`
      } else if (transfer.toLocationId) {
        movementType = 'IN'
        warehouseName = transfer.toLocation?.name || null
      } else if (transfer.fromLocationId) {
        movementType = 'OUT'
        warehouseName = transfer.fromLocation?.name || null
      }

      return {
        id: transfer.id,
        productId: transfer.productId,
        productName: transfer.product.name,
        type: movementType,
        quantity: transfer.quantity,
        warehouseName,
        fromLocationId: transfer.fromLocationId,
        fromLocationName: transfer.fromLocation?.name || null,
        toLocationId: transfer.toLocationId,
        toLocationName: transfer.toLocation?.name || null,
        reason: transfer.notes || null,
        referenceNumber: transfer.transferNumber || null,
        createdBy: transfer.createdBy,
        date: transfer.createdAt,
        status: transfer.status,
      }
    })

    return NextResponse.json({
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get stock movements error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/stock-movements - Create a new stock movement
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'inventory')

    const body = await request.json()
    const validated = createStockMovementSchema.parse(body)

    // Verify product exists
    const product = await prisma.product.findFirst({
      where: {
        id: validated.productId,
        tenantId,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify location exists
    const location = await prisma.location.findFirst({
      where: {
        id: validated.locationId,
        tenantId,
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Handle different movement types
    if (validated.type === 'IN') {
      // Stock In - increase inventory
      const inventory = await prisma.inventoryLocation.upsert({
        where: {
          tenantId_productId_locationId: {
            tenantId,
            productId: validated.productId,
            locationId: validated.locationId,
          },
        },
        update: {
          quantity: { increment: validated.quantity },
        },
        create: {
          tenantId,
          productId: validated.productId,
          locationId: validated.locationId,
          quantity: validated.quantity,
          reorderLevel: product.reorderLevel || 10,
        },
      })

      // Update main product quantity
      const totalQuantity = await prisma.inventoryLocation.aggregate({
        where: { tenantId, productId: validated.productId },
        _sum: { quantity: true },
      })

      await prisma.product.update({
        where: { id: validated.productId },
        data: {
          quantity: totalQuantity._sum.quantity || 0,
        },
      })

      return NextResponse.json({
        movement: {
          id: inventory.id,
          productId: validated.productId,
          productName: product.name,
          type: 'IN',
          quantity: validated.quantity,
          warehouseName: location.name,
          date: new Date(),
        },
      }, { status: 201 })
    } else if (validated.type === 'OUT') {
      // Stock Out - decrease inventory
      const inventory = await prisma.inventoryLocation.findUnique({
        where: {
          tenantId_productId_locationId: {
            tenantId,
            productId: validated.productId,
            locationId: validated.locationId,
          },
        },
      })

      if (!inventory || inventory.quantity < validated.quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        )
      }

      const updated = await prisma.inventoryLocation.update({
        where: {
          tenantId_productId_locationId: {
            tenantId,
            productId: validated.productId,
            locationId: validated.locationId,
          },
        },
        data: {
          quantity: { decrement: validated.quantity },
        },
      })

      // Update main product quantity
      const totalQuantity = await prisma.inventoryLocation.aggregate({
        where: { tenantId, productId: validated.productId },
        _sum: { quantity: true },
      })

      await prisma.product.update({
        where: { id: validated.productId },
        data: {
          quantity: totalQuantity._sum.quantity || 0,
        },
      })

      return NextResponse.json({
        movement: {
          id: updated.id,
          productId: validated.productId,
          productName: product.name,
          type: 'OUT',
          quantity: validated.quantity,
          warehouseName: location.name,
          date: new Date(),
        },
      }, { status: 201 })
    } else {
      // ADJUSTMENT - set specific quantity
      const inventory = await prisma.inventoryLocation.upsert({
        where: {
          tenantId_productId_locationId: {
            tenantId,
            productId: validated.productId,
            locationId: validated.locationId,
          },
        },
        update: {
          quantity: validated.quantity,
        },
        create: {
          tenantId,
          productId: validated.productId,
          locationId: validated.locationId,
          quantity: validated.quantity,
          reorderLevel: product.reorderLevel || 10,
        },
      })

      // Update main product quantity
      const totalQuantity = await prisma.inventoryLocation.aggregate({
        where: { tenantId, productId: validated.productId },
        _sum: { quantity: true },
      })

      await prisma.product.update({
        where: { id: validated.productId },
        data: {
          quantity: totalQuantity._sum.quantity || 0,
        },
      })

      return NextResponse.json({
        movement: {
          id: inventory.id,
          productId: validated.productId,
          productName: product.name,
          type: 'ADJUSTMENT',
          quantity: validated.quantity,
          warehouseName: location.name,
          date: new Date(),
        },
      }, { status: 201 })
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create stock movement error:', error)
    return NextResponse.json(
      { error: 'Failed to create stock movement' },
      { status: 500 }
    )
  }
}

