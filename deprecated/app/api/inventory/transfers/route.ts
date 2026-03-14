import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createTransferSchema = z.object({
  fromLocationId: z.string(),
  toLocationId: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
})

// GET /api/inventory/transfers - List stock transfers
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const locationId = searchParams.get('locationId')

    const where: any = { tenantId }
    if (status) where.status = status
    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ]
    }

    const transfers = await prisma.stockTransfer.findMany({
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
    })

    return NextResponse.json({ transfers })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get stock transfers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock transfers' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/transfers - Create stock transfer
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'inventory')

    const body = await request.json()
    const validated = createTransferSchema.parse(body)

    // Check if source location has enough stock
    const sourceInventory = await prisma.inventoryLocation.findUnique({
      where: {
        tenantId_productId_locationId: {
          tenantId,
          productId: validated.productId,
          locationId: validated.fromLocationId,
        },
      },
    })

    if (!sourceInventory || sourceInventory.quantity < validated.quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock at source location' },
        { status: 400 }
      )
    }

    // Generate transfer number
    const transferNumber = `TRF-${tenantId.substring(0, 8).toUpperCase()}-${Date.now()}`

    // Create transfer
    const transfer = await prisma.stockTransfer.create({
      data: {
        tenantId,
        transferNumber,
        fromLocationId: validated.fromLocationId,
        toLocationId: validated.toLocationId,
        productId: validated.productId,
        quantity: validated.quantity,
        status: 'PENDING',
        notes: validated.notes,
        createdById: userId,
      },
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
      },
    })

    // Reserve stock at source location
    await prisma.inventoryLocation.update({
      where: {
        tenantId_productId_locationId: {
          tenantId,
          productId: validated.productId,
          locationId: validated.fromLocationId,
        },
      },
      data: {
        reserved: {
          increment: validated.quantity,
        },
      },
    })

    return NextResponse.json({ transfer }, { status: 201 })
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

    console.error('Create stock transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to create stock transfer' },
      { status: 500 }
    )
  }
}

