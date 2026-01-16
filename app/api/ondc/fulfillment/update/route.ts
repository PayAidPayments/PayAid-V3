import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// POST /api/ondc/fulfillment/update - Update fulfillment status
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const body = await request.json()
    const { orderId, status, trackingUrl, trackingNumber } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    // Update ONDC order
    const ondcOrder = await prisma.ondcOrder.updateMany({
      where: {
        tenantId,
        ondcOrderId: orderId,
      },
      data: {
        status,
        trackingUrl,
        trackingNumber,
        updatedAt: new Date(),
      },
    })

    if (ondcOrder.count === 0) {
      return NextResponse.json(
        { error: 'ONDC order not found' },
        { status: 404 }
      )
    }

    // Update corresponding system order
    await prisma.order.updateMany({
      where: {
        tenantId,
        shippingOrderId: orderId,
      },
      data: {
        status: status === 'SHIPPED' ? 'shipped' : status === 'DELIVERED' ? 'delivered' : 'pending',
        trackingUrl,
      },
    })

    // TODO: Send update to ONDC API
    // await sendFulfillmentUpdateToONDC(tenantId, orderId, status, trackingUrl)

    return NextResponse.json({
      success: true,
      message: 'Fulfillment status updated',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Update fulfillment error:', error)
    return NextResponse.json(
      { error: 'Failed to update fulfillment status' },
      { status: 500 }
    )
  }
}

