import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateTableSchema = z.object({
  name: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  location: z.string().optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE']).optional(),
  notes: z.string().optional(),
})

// GET /api/industries/restaurant/tables/[id] - Get a single table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const table = await prisma.restaurantTable.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        currentOrder: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        orders: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        reservations: {
          take: 10,
          orderBy: {
            reservationDate: 'desc',
          },
        },
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    return NextResponse.json({ table })
  } catch (error) {
    console.error('Get restaurant table error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 }
    )
  }
}

// PATCH /api/industries/restaurant/tables/[id] - Update a table
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateTableSchema.parse(body)

    const table = await prisma.restaurantTable.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const updated = await prisma.restaurantTable.update({
      where: { id },
      data: validated,
      include: {
        currentOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
    })

    return NextResponse.json({ table: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update restaurant table error:', error)
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    )
  }
}

// DELETE /api/industries/restaurant/tables/[id] - Delete a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const table = await prisma.restaurantTable.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // Check if table has active orders or reservations
    if (table._count.orders > 0 || table._count.reservations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete table with existing orders or reservations' },
        { status: 400 }
      )
    }

    await prisma.restaurantTable.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Table deleted successfully' })
  } catch (error) {
    console.error('Delete restaurant table error:', error)
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    )
  }
}

