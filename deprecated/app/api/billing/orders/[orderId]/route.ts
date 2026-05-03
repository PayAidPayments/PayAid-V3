import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

// GET /api/billing/orders/[orderId] - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.orderId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            licensedModules: true,
            subscriptionTier: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify order belongs to user's tenant
    if (order.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get order items for subscription info
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      select: {
        productName: true,
        quantity: true,
        price: true,
        total: true,
      },
    })

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString(),
      modules: [], // Module info not stored in Order model - would need separate tracking
      items: orderItems,
    })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Failed to get order' },
      { status: 500 }
    )
  }
}

