import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createWarehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
})

const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

// GET /api/inventory/warehouses - List all warehouses (locations)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [warehouses, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          _count: {
            select: {
              inventoryLocations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.location.count({ where }),
    ])

    // Calculate stock value and product count for each warehouse
    const warehousesWithStats = await Promise.all(
      warehouses.map(async (warehouse) => {
        const inventoryItems = await prisma.inventoryLocation.findMany({
          where: { locationId: warehouse.id },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                costPrice: true,
                salePrice: true,
              },
            },
          },
        })

        const productCount = inventoryItems.length
        const stockValue = inventoryItems.reduce((sum, item) => {
          const price = item.product.costPrice || item.product.salePrice || 0
          return sum + (item.quantity * price)
        }, 0)

        return {
          id: warehouse.id,
          name: warehouse.name,
          code: warehouse.code,
          city: warehouse.city,
          state: warehouse.state,
          country: warehouse.country,
          address: warehouse.city && warehouse.state ? `${warehouse.city}, ${warehouse.state}` : null,
          isActive: warehouse.isActive,
          productCount,
          stockValue,
          createdAt: warehouse.createdAt,
          updatedAt: warehouse.updatedAt,
        }
      })
    )

    return NextResponse.json({
      warehouses: warehousesWithStats,
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
    console.error('Get warehouses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    )
  }
}

// POST /api/inventory/warehouses - Create a new warehouse
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const body = await request.json()
    const validated = createWarehouseSchema.parse(body)

    // Check if code already exists
    if (validated.code) {
      const existing = await prisma.location.findFirst({
        where: {
          tenantId,
          code: validated.code,
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Warehouse code already exists' },
          { status: 400 }
        )
      }
    }

    const warehouse = await prisma.location.create({
      data: {
        tenantId,
        name: validated.name,
        code: validated.code,
        city: validated.city,
        state: validated.state,
        country: validated.country || 'India',
        isActive: validated.isActive !== undefined ? validated.isActive : true,
      },
    })

    return NextResponse.json({ warehouse }, { status: 201 })
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
    console.error('Create warehouse error:', error)
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    )
  }
}

