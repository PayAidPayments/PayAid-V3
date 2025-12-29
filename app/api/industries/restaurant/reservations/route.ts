import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createReservationSchema = z.object({
  tableId: z.string().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional(),
  reservationDate: z.string().datetime(),
  partySize: z.number().int().positive(),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
})

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
})

// GET /api/industries/restaurant/reservations - List all reservations
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const tableId = searchParams.get('tableId')

    const where: any = {
      tenantId: user.tenantId,
    }

    if (status) {
      where.status = status
    }

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      where.reservationDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (tableId) {
      where.tableId = tableId
    }

    const reservations = await prisma.restaurantReservation.findMany({
      where,
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
            name: true,
            capacity: true,
          },
        },
      },
      orderBy: {
        reservationDate: 'asc',
      },
    })

    return NextResponse.json({ reservations })
  } catch (error) {
    console.error('Get restaurant reservations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

// POST /api/industries/restaurant/reservations - Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createReservationSchema.parse(body)

    // Generate unique reservation number
    const reservationNumber = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // If table is specified, verify it exists and is available
    if (validated.tableId) {
      const table = await prisma.restaurantTable.findFirst({
        where: {
          id: validated.tableId,
          tenantId: user.tenantId,
        },
      })

      if (!table) {
        return NextResponse.json(
          { error: 'Table not found' },
          { status: 404 }
        )
      }

      // Check if table is available at the reservation time
      const conflictingReservation = await prisma.restaurantReservation.findFirst({
        where: {
          tableId: validated.tableId,
          reservationDate: {
            gte: new Date(new Date(validated.reservationDate).getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            lte: new Date(new Date(validated.reservationDate).getTime() + 2 * 60 * 60 * 1000), // 2 hours after
          },
          status: {
            in: ['CONFIRMED', 'SEATED'],
          },
        },
      })

      if (conflictingReservation) {
        return NextResponse.json(
          { error: 'Table is already reserved for this time' },
          { status: 400 }
        )
      }
    }

    const reservation = await prisma.restaurantReservation.create({
      data: {
        tenantId: user.tenantId,
        reservationNumber,
        tableId: validated.tableId,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        customerEmail: validated.customerEmail,
        reservationDate: new Date(validated.reservationDate),
        partySize: validated.partySize,
        specialRequests: validated.specialRequests,
        notes: validated.notes,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        table: {
          select: {
            id: true,
            tableNumber: true,
            name: true,
            capacity: true,
          },
        },
      },
    })

    // Update table status if table is assigned
    if (validated.tableId) {
      await prisma.restaurantTable.update({
        where: { id: validated.tableId },
        data: { status: 'RESERVED' },
      })
    }

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create restaurant reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}

