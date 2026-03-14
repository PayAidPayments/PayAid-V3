import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createPOSchema = z.object({
  vendorId: z.string().min(1),
  poNumber: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).optional(),
  orderDate: z.string().datetime().optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    taxRate: z.number().min(0).max(100).optional(),
    hsnCode: z.string().optional(),
    notes: z.string().optional(),
  })),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
})

// GET /api/purchases/orders - List all purchase orders
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const vendorId = searchParams.get('vendorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId,
    }

    if (status) {
      where.status = status
    }

    if (vendorId) {
      where.vendorId = vendorId
    }

    const tenantWhere = { tenantId }

    const [orders, total, totalOrders, approvedCount, pendingCount, totalAmountResult] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              items: true,
              goodsReceipts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.count({ where: tenantWhere }),
      prisma.purchaseOrder.count({ where: { ...tenantWhere, status: 'APPROVED' } }),
      prisma.purchaseOrder.count({ where: { ...tenantWhere, status: 'PENDING_APPROVAL' } }),
      prisma.purchaseOrder.aggregate({ where: tenantWhere, _sum: { total: true } }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalOrders,
        approvedCount,
        pendingCount,
        totalAmount: Number(totalAmountResult._sum?.total ?? 0),
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get purchase orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

// POST /api/purchases/orders - Create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const validated = createPOSchema.parse(body)

    // Verify vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: validated.vendorId,
        tenantId,
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 400 })
    }

    // Generate PO number if not provided
    let poNumber = validated.poNumber
    if (!poNumber) {
      const count = await prisma.purchaseOrder.count({ where: { tenantId } })
      poNumber = `PO-${String(count + 1).padStart(6, '0')}`
    } else {
      // Check if PO number already exists
      const existing = await prisma.purchaseOrder.findFirst({
        where: {
          tenantId,
          poNumber,
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'PO number already exists' },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    let subtotal = 0
    let totalTax = 0

    const items = validated.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice
      const taxRate = item.taxRate || 0
      const itemTax = (itemSubtotal * taxRate) / 100
      const itemTotal = itemSubtotal + itemTax

      subtotal += itemSubtotal
      totalTax += itemTax

      return {
        productId: item.productId || null,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: taxRate,
        taxAmount: itemTax,
        total: itemTotal,
        hsnCode: item.hsnCode,
        notes: item.notes,
      }
    })

    const discount = validated.discount || 0
    const total = subtotal + totalTax - discount

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        tenantId,
        poNumber,
        vendorId: validated.vendorId,
        status: validated.status || 'DRAFT',
        orderDate: validated.orderDate ? new Date(validated.orderDate) : new Date(),
        expectedDeliveryDate: validated.expectedDeliveryDate ? new Date(validated.expectedDeliveryDate) : null,
        subtotal,
        tax: totalTax,
        discount,
        total,
        requestedById: userId,
        notes: validated.notes,
        termsAndConditions: validated.termsAndConditions,
        items: {
          create: items,
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
            goodsReceipts: true,
          },
        },
      },
    })

    return NextResponse.json({ order: purchaseOrder }, { status: 201 })
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
    console.error('Create purchase order error:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}

