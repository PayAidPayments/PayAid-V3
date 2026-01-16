import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createOrderSchema = z.object({
  storeId: z.string(),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  shippingAddress: z.record(z.any()).optional(),
  billingAddress: z.record(z.any()).optional(),
  items: z.array(
    z.object({
      productId: z.string().optional(),
      productName: z.string().min(1),
      productSku: z.string().optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
  paymentMethod: z.string().optional(),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/ecommerce/orders
 * List orders
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const customerEmail = searchParams.get('customerEmail')

    const where: any = { tenantId }
    if (storeId) where.storeId = storeId
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (customerEmail) where.customerEmail = customerEmail

    const orders = await prisma.ecommerceOrder.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
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
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ecommerce/orders
 * Create order
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    // Verify store belongs to tenant
    const store = await prisma.ecommerceStore.findFirst({
      where: {
        id: validated.storeId,
        tenantId,
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    // Calculate totals
    const subtotal = validated.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const tax = subtotal * 0.18 // 18% GST (can be made configurable)
    const shipping = 0 // Can be calculated based on shipping method
    const discount = 0
    const total = subtotal + tax + shipping - discount

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order with items
    const order = await prisma.ecommerceOrder.create({
      data: {
        storeId: validated.storeId,
        tenantId,
        orderNumber,
        customerEmail: validated.customerEmail,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        shippingAddress: validated.shippingAddress,
        billingAddress: validated.billingAddress,
        paymentMethod: validated.paymentMethod || 'PayAid Payments',
        shippingMethod: validated.shippingMethod,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        currency: 'INR',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        notes: validated.notes,
        items: {
          create: validated.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        items: true,
        store: true,
      },
    })

    // Update inventory if products are linked
    for (const item of validated.items) {
      if (item.productId) {
        const product = await prisma.ecommerceProduct.findUnique({
          where: { id: item.productId },
        })
        if (product && product.trackInventory) {
          await prisma.ecommerceProduct.update({
            where: { id: item.productId },
            data: {
              inventoryQuantity: {
                decrement: item.quantity,
              },
            },
          })
        }
      }
    }

    return NextResponse.json({ order }, { status: 201 })
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

    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

