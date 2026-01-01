import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createBatchSerialSchema = z.object({
  productId: z.string(),
  batchNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  locationId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  expiryDate: z.string().datetime().optional(),
  manufacturingDate: z.string().datetime().optional(),
  purchaseDate: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
})

// GET /api/inventory/batch-serial - List batch/serial numbers
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const locationId = searchParams.get('locationId')
    const batchNumber = searchParams.get('batchNumber')
    const serialNumber = searchParams.get('serialNumber')
    const status = searchParams.get('status')

    const where: any = { tenantId }
    if (productId) where.productId = productId
    if (locationId) where.locationId = locationId
    if (batchNumber) where.batchNumber = batchNumber
    if (serialNumber) where.serialNumber = serialNumber
    if (status) where.status = status

    const batchSerials = await prisma.batchSerial.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ batchSerials })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get batch serials error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch/serial numbers' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/batch-serial - Create batch/serial number
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createBatchSerialSchema.parse(body)

    // If serial number provided, check uniqueness
    if (validated.serialNumber) {
      const existing = await prisma.batchSerial.findUnique({
        where: {
          tenantId_productId_serialNumber: {
            tenantId,
            productId: validated.productId,
            serialNumber: validated.serialNumber,
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Serial number already exists for this product' },
          { status: 400 }
        )
      }
    }

    const batchSerial = await prisma.batchSerial.create({
      data: {
        tenantId,
        productId: validated.productId,
        batchNumber: validated.batchNumber,
        serialNumber: validated.serialNumber,
        locationId: validated.locationId,
        quantity: validated.quantity,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        manufacturingDate: validated.manufacturingDate ? new Date(validated.manufacturingDate) : null,
        purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : null,
        cost: validated.cost ? new Decimal(validated.cost) : null,
      },
      include: {
        product: true,
        location: true,
      },
    })

    return NextResponse.json({ batchSerial }, { status: 201 })
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

    console.error('Create batch serial error:', error)
    return NextResponse.json(
      { error: 'Failed to create batch/serial number' },
      { status: 500 }
    )
  }
}

