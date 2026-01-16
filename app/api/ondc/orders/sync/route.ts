import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// POST /api/ondc/orders/sync - Sync orders from ONDC
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const body = await request.json()
    const { orderId, orderData } = body

    if (!orderId || !orderData) {
      return NextResponse.json(
        { error: 'Order ID and order data are required' },
        { status: 400 }
      )
    }

    // Get or create ONDC integration
    let ondcIntegration = await prisma.ondcIntegration.findFirst({
      where: { tenantId },
    })

    if (!ondcIntegration) {
      return NextResponse.json(
        { error: 'ONDC integration not configured' },
        { status: 400 }
      )
    }

    // Create or update ONDC order
    const ondcOrder = await prisma.ondcOrder.upsert({
      where: {
        tenantId_ondcOrderId: {
          tenantId,
          ondcOrderId: orderId,
        },
      },
      update: {
        status: orderData.status || 'PENDING',
        orderData: orderData as any,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        ondcOrderId: orderId,
        status: orderData.status || 'PENDING',
        orderData: orderData as any,
      },
    })

    // Create corresponding order in system if not exists
    const existingOrder = await prisma.order.findFirst({
      where: {
        tenantId,
        orderNumber: `ONDC-${orderId}`,
      },
    })

    if (!existingOrder && orderData.items) {
      const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const tax = subtotal * 0.18 // 18% GST
      const total = subtotal + tax

      await prisma.order.create({
        data: {
          tenantId,
          orderNumber: `ONDC-${orderId}`,
          status: 'pending',
          subtotal,
          tax,
          shipping: orderData.shipping || 0,
          total,
          shippingAddress: orderData.shippingAddress || '',
          shippingCity: orderData.shippingCity || '',
          shippingPostal: orderData.shippingPostal || '',
          shippingCountry: orderData.shippingCountry || 'India',
          shippingOrderId: orderId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      order: ondcOrder,
      message: 'Order synced successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Sync ONDC order error:', error)
    return NextResponse.json(
      { error: 'Failed to sync ONDC order' },
      { status: 500 }
    )
  }
}

// GET /api/ondc/orders/sync - Get synced orders
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { tenantId }
    if (status) {
      where.status = status
    }

    const orders = await prisma.ondcOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ orders })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get ONDC orders error:', error)
    return NextResponse.json(
      { error: 'Failed to get ONDC orders' },
      { status: 500 }
    )
  }
}

