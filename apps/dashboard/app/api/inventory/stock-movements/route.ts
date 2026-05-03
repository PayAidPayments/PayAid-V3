import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { dbOverloadResponse, isTransientDbOverloadError } from '@/lib/api/db-overload'

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

    const where: any = { tenantId }

    if (type && type !== 'all') {
      where.movementType = type
    }

    if (productId) {
      where.productId = productId
    }

    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          fromLocation: { select: { id: true, name: true } },
          toLocation: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockTransfer.count({ where }),
    ])

    const movements = transfers.map((transfer) => {
      const resolvedType = (transfer.movementType as 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT') ||
        (transfer.fromLocationId && transfer.toLocationId ? 'TRANSFER'
          : transfer.toLocationId ? 'IN'
          : transfer.fromLocationId ? 'OUT'
          : 'ADJUSTMENT')

      let warehouseName: string | null = null
      if (resolvedType === 'TRANSFER') {
        warehouseName = `${transfer.fromLocation?.name ?? ''} → ${transfer.toLocation?.name ?? ''}`
      } else if (resolvedType === 'IN') {
        warehouseName = transfer.toLocation?.name ?? null
      } else {
        warehouseName = transfer.fromLocation?.name ?? null
      }

      return {
        id: transfer.id,
        productId: transfer.productId,
        productName: transfer.product.name,
        type: resolvedType,
        quantity: transfer.quantity,
        warehouseName,
        fromLocationId: transfer.fromLocationId,
        fromLocationName: transfer.fromLocation?.name ?? null,
        toLocationId: transfer.toLocationId,
        toLocationName: transfer.toLocation?.name ?? null,
        reason: (transfer as any).reason ?? transfer.notes ?? null,
        referenceNumber: (transfer as any).referenceNumber ?? transfer.transferNumber ?? null,
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

    // Generate a unique transfer/movement number
    const movementNumber = `SM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Handle different movement types
    if (validated.type === 'IN') {
      await prisma.inventoryLocation.upsert({
        where: {
          tenantId_productId_locationId: {
            tenantId,
            productId: validated.productId,
            locationId: validated.locationId,
          },
        },
        update: { quantity: { increment: validated.quantity } },
        create: {
          tenantId,
          productId: validated.productId,
          locationId: validated.locationId,
          quantity: validated.quantity,
          reorderLevel: product.reorderLevel || 10,
        },
      })
    } else if (validated.type === 'OUT') {
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
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
      }

      await prisma.inventoryLocation.update({
        where: {
          tenantId_productId_locationId: {
            tenantId,
            productId: validated.productId,
            locationId: validated.locationId,
          },
        },
        data: { quantity: { decrement: validated.quantity } },
      })
    } else {
      // ADJUSTMENT - set specific quantity
      await prisma.inventoryLocation.upsert({
        where: {
          tenantId_productId_locationId: {
            tenantId,
            productId: validated.productId,
            locationId: validated.locationId,
          },
        },
        update: { quantity: validated.quantity },
        create: {
          tenantId,
          productId: validated.productId,
          locationId: validated.locationId,
          quantity: validated.quantity,
          reorderLevel: product.reorderLevel || 10,
        },
      })
    }

    // Roll up product total quantity
    const totalQuantity = await prisma.inventoryLocation.aggregate({
      where: { tenantId, productId: validated.productId },
      _sum: { quantity: true },
    })
    await prisma.product.update({
      where: { id: validated.productId },
      data: { quantity: totalQuantity._sum.quantity || 0 },
    })

    // Persist an audit record in StockTransfer so the list page can display it
    const transfer = await prisma.stockTransfer.create({
      data: {
        tenantId,
        transferNumber: movementNumber,
        movementType: validated.type,
        productId: validated.productId,
        quantity: validated.quantity,
        // IN → toLocation only; OUT → fromLocation only; ADJUSTMENT → toLocation
        fromLocationId: validated.type === 'OUT' ? validated.locationId : null,
        toLocationId: validated.type !== 'OUT' ? validated.locationId : null,
        status: 'COMPLETED',
        reason: validated.reason || null,
        notes: validated.notes || null,
        referenceNumber: validated.referenceNumber || null,
        transferDate: new Date(),
        createdById: userId || null,
      },
    })

    return NextResponse.json({
      movement: {
        id: transfer.id,
        productId: validated.productId,
        productName: product.name,
        type: validated.type,
        quantity: validated.quantity,
        warehouseName: location.name,
        referenceNumber: movementNumber,
        date: transfer.createdAt,
      },
    }, { status: 201 })
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
    if (isTransientDbOverloadError(error)) {
      return dbOverloadResponse('Stock movement')
    }
    console.error('Create stock movement error:', error)
    return NextResponse.json(
      { error: 'Failed to create stock movement' },
      { status: 500 }
    )
  }
}

