import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateReservationSchema = z.object({
  tableId: z.string().optional().nullable(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().nullable(),
  reservationDate: z.string().datetime().optional(),
  partySize: z.number().int().positive().optional(),
  status: z.enum(['CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW', 'COMPLETED']).optional(),
  specialRequests: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  cancelledReason: z.string().optional(),
})

// GET /api/industries/restaurant/reservations/[id] - Get a single reservation
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

    const reservation = await prisma.restaurantReservation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
            name: true,
            capacity: true,
            status: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error('Get restaurant reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    )
  }
}

// PATCH /api/industries/restaurant/reservations/[id] - Update a reservation
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
    const validated = updateReservationSchema.parse(body)

    const reservation = await prisma.restaurantReservation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (validated.tableId !== undefined) updateData.tableId = validated.tableId
    if (validated.customerName) updateData.customerName = validated.customerName
    if (validated.customerPhone) updateData.customerPhone = validated.customerPhone
    if (validated.customerEmail !== undefined) updateData.customerEmail = validated.customerEmail
    if (validated.reservationDate) updateData.reservationDate = new Date(validated.reservationDate)
    if (validated.partySize) updateData.partySize = validated.partySize
    if (validated.specialRequests !== undefined) updateData.specialRequests = validated.specialRequests
    if (validated.notes !== undefined) updateData.notes = validated.notes
    if (validated.cancelledReason) updateData.cancelledReason = validated.cancelledReason

    // Handle status changes
    if (validated.status) {
      updateData.status = validated.status

      if (validated.status === 'SEATED' && !reservation.seatedAt) {
        updateData.seatedAt = new Date()
      }

      if (validated.status === 'CANCELLED' && !reservation.cancelledAt) {
        updateData.cancelledAt = new Date()
      }
    }

    const updated = await prisma.restaurantReservation.update({
      where: { id },
      data: updateData,
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
            name: true,
            capacity: true,
            status: true,
          },
        },
      },
    })

    // Update table status based on reservation status
    if (validated.status && updated.tableId) {
      if (validated.status === 'SEATED') {
        await prisma.restaurantTable.update({
          where: { id: updated.tableId },
          data: { status: 'OCCUPIED' },
        })
      } else if (validated.status === 'CANCELLED' || validated.status === 'NO_SHOW' || validated.status === 'COMPLETED') {
        await prisma.restaurantTable.update({
          where: { id: updated.tableId },
          data: { status: 'AVAILABLE' },
        })
      }
    }

    return NextResponse.json({ reservation: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update restaurant reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

// DELETE /api/industries/restaurant/reservations/[id] - Cancel a reservation
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

    const reservation = await prisma.restaurantReservation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Cancel the reservation instead of deleting
    const cancelled = await prisma.restaurantReservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    // Free up the table if it was assigned
    if (cancelled.tableId) {
      await prisma.restaurantTable.update({
        where: { id: cancelled.tableId },
        data: { status: 'AVAILABLE' },
      })
    }

    return NextResponse.json({ message: 'Reservation cancelled successfully', reservation: cancelled })
  } catch (error) {
    console.error('Cancel restaurant reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    )
  }
}

