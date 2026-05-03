import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { createFulfillment, updateFulfillmentStatus } from '@/lib/ecommerce/channels'
import { z } from 'zod'

const createFulfillmentSchema = z.object({
  orderId: z.string(),
  channel: z.enum(['amazon', 'flipkart', 'shopify', 'woocommerce', 'custom']),
  channelOrderId: z.string(),
})

const updateFulfillmentSchema = z.object({
  fulfillmentId: z.string(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
})

// GET /api/ecommerce/fulfillment - Get fulfillments
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const orderId = request.nextUrl.searchParams.get('orderId')
    const status = request.nextUrl.searchParams.get('status')

    // Return fulfillments (would query from database)
    return NextResponse.json({
      success: true,
      fulfillments: [],
    })
  } catch (error: any) {
    console.error('Get fulfillments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get fulfillments' },
      { status: 500 }
    )
  }
}

// POST /api/ecommerce/fulfillment - Create fulfillment
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()

    if (body.fulfillmentId) {
      // Update fulfillment
      const validated = updateFulfillmentSchema.parse(body)
      await updateFulfillmentStatus(
        tenantId,
        validated.fulfillmentId,
        validated.status,
        validated.trackingNumber,
        validated.carrier
      )

      return NextResponse.json({
        success: true,
        message: 'Fulfillment updated',
      })
    } else {
      // Create fulfillment
      const validated = createFulfillmentSchema.parse(body)
      const fulfillment = await createFulfillment(
        tenantId,
        validated.orderId,
        validated.channel,
        validated.channelOrderId
      )

      return NextResponse.json({
        success: true,
        fulfillment,
      })
    }
  } catch (error: any) {
    console.error('Fulfillment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process fulfillment' },
      { status: 500 }
    )
  }
}

