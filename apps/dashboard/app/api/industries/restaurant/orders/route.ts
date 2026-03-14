import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createOrderSchema = z.object({
  tableNumber: z.number().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(
    z.object({
      menuItemId: z.string(),
      quantity: z.number().min(1),
      specialInstructions: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
})

// GET /api/industries/restaurant/orders - List restaurant orders
export async function GET(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Verify tenant is restaurant industry
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'restaurant') {
      return NextResponse.json(
        { error: 'This endpoint is only for restaurant industry' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {
      tenantId: tenantId,
    }

    if (status) {
      where.status = status
    }

    const orders = await prisma.restaurantOrder.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    })

    const total = await prisma.restaurantOrder.count({ where })

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get restaurant orders error:', error)
    return NextResponse.json(
      { error: 'Failed to get restaurant orders' },
      { status: 500 }
    )
  }
}

// POST /api/industries/restaurant/orders - Create new restaurant order
export async function POST(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Verify tenant is restaurant industry
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'restaurant') {
      return NextResponse.json(
        { error: 'This endpoint is only for restaurant industry' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    // Generate order number
    const orderCount = await prisma.restaurantOrder.count({
      where: { tenantId: tenantId },
    })
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`

    // Calculate totals
    let totalAmount = 0
    const orderItems = []

    for (const item of validated.items) {
      const menuItem = await prisma.restaurantMenuItem.findFirst({
        where: {
          id: item.menuItemId,
          tenantId: tenantId,
          isAvailable: true,
        },
      })

      if (!menuItem) {
        return NextResponse.json(
          { error: `Menu item ${item.menuItemId} not found or unavailable` },
          { status: 404 }
        )
      }

      const subtotal = Number(menuItem.price) * item.quantity
      totalAmount += subtotal

      orderItems.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: menuItem.price,
        subtotal,
        specialInstructions: item.specialInstructions,
      })
    }

    // Create order with items
    const order = await prisma.restaurantOrder.create({
      data: {
        tenantId: tenantId,
        orderNumber,
        tableNumber: validated.tableNumber,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        totalAmount,
        status: 'PENDING',
        notes: validated.notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create restaurant order error:', error)
    return NextResponse.json(
      { error: 'Failed to create restaurant order' },
      { status: 500 }
    )
  }
}
