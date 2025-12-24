import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'COOKING', 'READY', 'SERVED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  estimatedTime: z.number().optional(),
  notes: z.string().optional(),
})

// GET /api/industries/restaurant/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const order = await prisma.restaurantOrder.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Get restaurant order error:', error)
    return NextResponse.json(
      { error: 'Failed to get restaurant order' },
      { status: 500 }
    )
  }
}

// PATCH /api/industries/restaurant/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = updateOrderSchema.parse(body)

    const order = await prisma.restaurantOrder.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (validated.status) updateData.status = validated.status
    if (validated.paymentStatus) updateData.paymentStatus = validated.paymentStatus
    if (validated.estimatedTime !== undefined) updateData.estimatedTime = validated.estimatedTime
    if (validated.notes !== undefined) updateData.notes = validated.notes

    // Set servedAt when status changes to SERVED
    if (validated.status === 'SERVED' && order.status !== 'SERVED') {
      updateData.servedAt = new Date()
    }

    const updatedOrder = await prisma.restaurantOrder.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update restaurant order error:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant order' },
      { status: 500 }
    )
  }
}
